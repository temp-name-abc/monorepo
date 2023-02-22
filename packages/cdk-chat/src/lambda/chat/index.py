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
import urllib.parse

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb_client = boto3.client("dynamodb")
secrets_manager_client = boto3.client("secretsmanager")

MEMORY_LENGTH = 5


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

    # Create prompts and initialize token usage
    total_chars = 0

    initial_text_prompt_template = """The following is a friendly conversation between a human and an AI.
    The AI is talkative and provides lots of specific details from its context.
    If the AI does not know the answer to a question, it truthfully says it does not know.
    
    Current conversation:
    {}""" 

    enough_information_prompt_template = """The following answers whether the context provided in the following 'Prompt' is sufficient to answer the 'Question'.
    The only responses can be 'yes' or 'no'.

    Question:
    {}
    
    Prompt:
    {}
    
    Answer:"""

    chat_context_prompt_template = """The following answers whether the context provided in the following 'Prompt' and 'Context' is sufficient to answer the 'Question'.
    The only responses can be 'yes' or 'no'.
    
    Question:
    {}

    Context:
    {}
    
    Prompt:
    {}
    
    Answer:"""

    query_prompt_template = """The following provides a 'Query' that can be used to search for additional information for the 'Question' given the existing 'Context'.

    Question:
    {}

    Context:
    {}
    
    Query:"""

    summary_prompt_template = """Create a summary for the following 'Document' that contains all the information required to answer the 'Question' given the 'Prompt'.

    Question:
    {}

    Prompt:
    {}

    Document:
    {}

    Summary:"""

    # Create conversation
    conversation = "\n".join([
        f"""Human: {chat["human"]}
        Context: {". ".join([document["summary"] for document in chat["context"]]) if "context" in chat else "N/A"}
        AI: {chat["ai"]}
        """
    ] for chat in context)

    # Check if there is enough information in the given response to answer the question
    initial_text_prompt = initial_text_prompt_template.format(question, conversation)
    enough_information_prompt = enough_information_prompt_template.format(initial_text_prompt)

    enough_information = openai.Completion.create(
        model="text-davinci-003",
        prompt=enough_information_prompt,
        temperature=0.7
    )["choices"][0]["text"]

    total_chars += len(enough_information_prompt) + len(enough_information)

    # Enrich the response
    additional_context = []

    if enough_information != "yes":
        query_prompt = query_prompt_template.format(question, initial_text_prompt)

        query = openai.Completion.create(
            model="text-davinci-003",
            prompt=query_prompt,
            temperature=0.7
        )["choices"][0]["text"]

        total_chars += len(query_prompt) + len(query)

        query_params = urllib.parse.urlencode({"query": query, "userId": user_id, "collectionId": collection_id, "numResults": 1})
        documents_url = f"{api_url}/storage/iam/search?{query_params}"
        documents_request = make_request(documents_url, "GET")
        documents_req = requests.get(documents_url, headers=documents_request.headers, data=documents_request.data)

        if not documents_req.ok:
            logger.error(f"Unable to find documents with status '{documents_req.status_code}'")

            raise Exception("Unable to get search documents")

        # Create summary of document to give additional context
        document_response = documents_req.json()

        if len(document_response) > 0:        
            document = document_response[0]

            summary_prompt = summary_prompt_template.format(question, initial_text_prompt, document["body"])

            summary = openai.Completion.create(
                model="text-davinci-003",
                prompt=summary_prompt,
                temperature=0.7
            )["choices"][0]["text"]

            total_chars += len(summary_prompt) + len(summary)

            additional_context.append({"summary": summary, "documentId": document["id"]})

            # Check if we now have enough context

    # Check if the new prompt with the context can match the query

    # **** Make sure that we also update the previous data with the new question, context, and response
    # **** We need to record the amount of tokens used for this as well for billing...
