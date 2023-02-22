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
    memory_size = int(os.getenv("MEMORY_SIZE"))

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

Answer: """

    query_prompt_template = """The following provides a 'Query' that can be used to search for additional information for the 'Question' given the existing 'Context'.

Question:
{}

Context:
{}

Query: """

    summary_prompt_template = """The following takes a 'Document' and returns a summary that contains all relevant information for the 'Question' using only information in 'Document'.
If there is no information in 'Document' relevant to 'Question', then there should be no summary.

Question:
{}

Document:
{}

Summary: """

    # Create conversation
    conversation = "\n".join(
        f"""Human: {chat["human"]}
Context: {". ".join([document["summary"] for document in chat["context"]]) if len(chat["context"]) > 0 else "N/A"}
AI: {chat["ai"]}"""
    for chat in context)

    # Check if there is enough information in the given response to answer the question
    initial_text_prompt = initial_text_prompt_template.format(conversation)
    enough_information_prompt = enough_information_prompt_template.format(question, initial_text_prompt)

    enough_information = openai.Completion.create(
        model="text-davinci-003",
        prompt=enough_information_prompt,
        temperature=0.7,
        max_tokens=2048
    )["choices"][0]["text"]

    total_chars += len(enough_information_prompt) + len(enough_information)
    logging.info(f"Enough information response '{enough_information_prompt + enough_information}'")

    # Enrich the response
    additional_context = []

    if enough_information.strip().lower() != "yes":
        query_prompt = query_prompt_template.format(question, initial_text_prompt)

        query = openai.Completion.create(
            model="text-davinci-003",
            prompt=query_prompt,
            temperature=0.7,
            max_tokens=2048
        )["choices"][0]["text"]

        total_chars += len(query_prompt) + len(query)
        logging.info(f"Query response '{query_prompt + query}'")

        query_encoded = urllib.parse.quote(query.strip())

        documents_url = f"{api_url}/storage/iam/search?userId={user_id}&collectionId={collection_id}&numResults=1&query={query_encoded}"
        documents_request = make_request(documents_url, "GET")
        documents_req = requests.get(documents_url, headers=documents_request.headers)

        if not documents_req.ok:
            logger.error(f"Unable to find documents with status '{documents_req.status_code}'")
        
        elif len(documents_req.json()) == 0:
            logger.error(f"No documents found")
        
        else:
            document_response = documents_req.json()

            document = document_response[0]

            summary_prompt = summary_prompt_template.format(question, document["body"])

            summary = openai.Completion.create(
                model="text-davinci-003",
                prompt=summary_prompt,
                temperature=0.7,
                max_tokens=2048
            )["choices"][0]["text"]

            total_chars += len(summary_prompt) + len(summary)
            logger.info(f"Summary response '{summary_prompt + summary}'")

            additional_context.append({"summary": summary.strip(), "documentId": document["id"]})

    # Generate the response
    chat_prompt = f"""{initial_text_prompt}
Human: {question}
Context: {". ".join([document["summary"] for document in additional_context]) if len(additional_context) > 0 else "N/A"}
AI: """

    chat_response = openai.Completion.create(
        model="text-davinci-003",
        prompt=chat_prompt,
        temperature=0.7
    )["choices"][0]["text"]

    total_chars += len(chat_prompt) + len(chat_response)
    logger.info(f"Chat response '{chat_prompt + chat_response}'")

    # Store the data
    tokens = total_chars // 4

    context.append({
        "human": question,
        "context": additional_context,
        "ai": chat_response.strip()
    })
    context = context[len(context) - memory_size:len(context)]

    item = {
        "chatId": {"S": chat_id},
        "conversationId": {"S": conversation_id},
        "collectionId": {"S": collection_id},
        "timestamp": {"N": str(timestamp)},
        "question": {"S": question},
        "response": {"S": chat_response.strip()},
        "prompt": {"S": chat_prompt},
        "tokens": {"N": str(tokens)},
        "context": {"S": json.dumps(context)}
    }

    if prev_chat_id is not None:
        item["previousChatId"] = {"S": prev_chat_id}

    dynamodb_client.put_item(
        TableName=conversations_table,
        Item=item
    )

    # Record the usage
    usage_url = f"{api_url}/billing/iam/usage"
    usage_request = make_request(usage_url, "POST", json.dumps({
        "userId": user_id,
        "timestamp": timestamp,
        "productId": product_id,
        "quantity": tokens
    }))
    usage_req = requests.post(
        usage_url,
        headers=usage_request.headers,
        data=usage_request.data
    )

    if not usage_req.ok:
        logger.warning(f"Unable to record usage for user '{user_id}' with product '{product_id}' with status code '{usage_req.status_code}'")

    # Return the data
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "chatId": chat_id,
            "conversationId": conversation_id,
            "collectionId": collection_id,
            "timestamp": timestamp,
            "question": question,
            "response": chat_response.strip(),
            "prompt": chat_prompt,
            "tokens": tokens,
            "context": context,
            "previousChatId": prev_chat_id
        })
    }