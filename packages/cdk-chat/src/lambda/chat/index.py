import boto3
import json
import os
import logging
import openai
import requests
from datetime import datetime
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb_client = boto3.client("dynamodb")
secrets_manager_client = boto3.client("secretsmanager")

MAX_DOCUMENT_FETCH = 1
MEMORY_LENGTH = 5


def generate_prompt(context, question):
    initial_text_prompt_template = """The following is a friendly conversation between a human and an AI.
    The AI is talkative and provides lots of specific details from its context.
    If the AI does not know the answer to a question, it truthfully says it does not know.
    
    Current conversation:
    {}""" 

    enough_information_prompt_template = """The following answers whether the context provided in the following 'prompt' is sufficient to answer the 'question'.
    The only responses can be 'yes' or 'no'.

    Question:
    {}
    
    Prompt:
    {}"""

    conversation = "\n".join([
        f"""Human: {chat["human"]}
        Context: {". ".join([document["summary"] for document in chat["context"]]) if "context" in chat else "N/A"}
        AI: {chat["ai"]}
        """
    ] for chat in context)

    initial_text_prompt = initial_text_prompt_template.format(question, conversation)

    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=enough_information_prompt_template.format(initial_text_prompt),
        temperature=0.7
    )["choices"][0]["text"]

    # Enrich the response
    additional_context = []

    if response == "yes":
        pass

    else:
        # Retrieve additional documents for the context
        pass

    # **** We need to record the amount of tokens used for this as well for billing...


def make_request(url, method, data = None):
    session = boto3.session.Session()
    credentials = session.get_credentials()
    region = os.getenv("AWS_REGION")
    service = "execute-api"

    headers = {
        "Content-Type": "application/json"
    }

    http_request = AWSRequest(method=method, url=url, headers=headers, data=data)
    SigV4Auth(credentials, service, region).add_auth(http_request)

    return http_request


def lambda_handler(event, context):
    logger.info(f"Processing chat for '{event}'")

    openai_secret = os.getenv("OPENAI_SECRET")
    conversations_table = os.getenv("CONVERSATIONS_TABLE")
    api_url = os.getenv("API_URL")
    product_id = os.getenv("PRODUCT_ID")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

    body = json.loads(event["body"])

    # Load and validate parameters
    prev_chat_id = body["previousChatId"] if "previousChatId" in body else None
    collection_id = body["collectionId"] if "collectionId" in body else None
    question = body["question"]

    if prev_chat_id != None and collection_id != None:
        msg = "Requires at least one of 'previousChatId' or 'collectionId'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Load the OpenAI API key
    openai.api_key = secrets_manager_client.get_secret_value(SecretId=openai_secret)["SecretString"]

    # Load the chat data
    chat_id = str(uuid.uuid4())
    conversation_id = str(uuid.uuid4())
    context = []

    now = datetime.utcnow()
    timestamp = int(now.timestamp())

    if prev_chat_id != None:
        prev_chat_data = dynamodb_client.get_item(
            TableName=conversations_table,
            Key={"chatId": {"S": prev_chat_id}}
        )["Item"]

        collection_id = prev_chat_data["collectionId"]["S"]
        conversation_id = prev_chat_data["conversationId"]["S"]
        context = json.loads(prev_chat_data["context"]["S"])

    # Check the user can be billed bill
    active_url = f"{api_url}/billing/iam/status?userId={user_id}&productId={product_id}"
    active_request = make_request(active_url, "GET")
    active_req = requests.get(active_url, headers=active_request.headers)

    if not active_req.ok or not active_req.json()["active"]:
        msg = f"User '{user_id}' has not subscribed to product '{product_id}' with status code '{active_req.status_code}'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Ge the response