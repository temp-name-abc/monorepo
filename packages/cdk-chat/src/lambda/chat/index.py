import boto3
import json
import os
import logging
import requests
from datetime import datetime
import uuid
import urllib.parse
import utils
import openai

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb_client = boto3.client("dynamodb")
secrets_manager_client = boto3.client("secretsmanager")

model_settings = {"max_tokens": 2048, "temperature": 0.5, "model": "text-davinci-003"}


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
    conversation_id = body["conversationId"] if "conversationId" in body else None
    prev_chat_id = body["chatId"] if "chatId" in body else None
    collection_id = body["collectionId"] if "collectionId" in body else None
    question = body["question"]

    if not (collection_id != None or (conversation_id != None and prev_chat_id != None)):
        msg = "Requires at least one of 'collectionId' or 'conversationId' and 'chatId'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Load the OpenAI API key
    utils.set_openai_api_key(secrets_manager_client.get_secret_value(SecretId=openai_secret)["SecretString"])

    # Load the chat data
    conversation_id = str(uuid.uuid4()) if conversation_id is None else conversation_id
    chat_id = str(uuid.uuid4())
    history = []
    context = []

    now = datetime.utcnow()
    timestamp = int(now.timestamp())

    if conversation_id != None and prev_chat_id != None:
        prev_chat_data = dynamodb_client.get_item(
            TableName=conversations_table,
            Key={
                "conversationId": {"S": conversation_id},
                "chatId": {"S": prev_chat_id}
                }
        )["Item"]

        collection_id = prev_chat_data["collectionId"]["S"]
        history = json.loads(prev_chat_data["history"]["S"])
        context = json.loads(prev_chat_data["context"]["S"])

    # Check the user can be billed bill
    active_url = f"{api_url}/billing/iam/status?userId={user_id}&productId={product_id}"
    active_request = utils.make_request(active_url, "GET")
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

    # Get the conversation
    tokens = 0

    conversation_text = utils.create_conversation(history)
    context_text = utils.create_context(context)

    # Check if there is enough context
    enough_info_prompt = utils.prompt_enough_info(context_text, conversation_text, question)
    enough_info, enough_info_tokens = utils.generate_text(enough_info_prompt)

    enough_info = enough_info.lower()
    tokens += enough_info_tokens
    logger.info(f"Enough info prompt = '{enough_info_prompt}', response = '{enough_info}'")

    if enough_info != "yes":
        # Figure out what needs requesting
        query_prompt = utils.prompt_query(conversation_text, question)
        query, query_tokens = utils.generate_text(query_prompt)

        tokens += query_tokens
        logger.info(f"Query prompt = '{query_prompt}', response = '{query}'")

        # Retrieve query
        query_encoded = urllib.parse.quote(query)
        documents_url = f"{api_url}/storage/iam/search?userId={user_id}&collectionId={collection_id}&numResults=1&query={query_encoded}"
        documents_request = utils.make_request(documents_url, "GET")
        documents_req = requests.get(documents_url, headers=documents_request.headers)

        if not documents_req.ok:
            logger.error(f"Unable to find documents with status '{documents_req.status_code}'")
        
        elif len(documents_req.json()) == 0:
            logger.warning(f"No documents found")
        
        else:
            document = documents_req.json()[0]

            context.append({"body": document["body"], "id": document["id"]})
            context = context[len(context) - memory_size:]

            logger.info(f"Retrieved context document '{document['id']}'")

    # Update the context, generate the response, and update the history
    context_text = utils.create_context(context)

    chat_prompt = utils.prompt_chat(context_text, conversation_text, question)
    chat, chat_tokens = utils.generate_text(chat_prompt)

    tokens += chat_tokens
    logger.info(f"Chat prompt = '{chat_prompt}', response = '{chat}'")

    history.append({"human": question, "ai": chat, "chatId": chat_id})

    # Store the data
    dynamodb_client.put_item(
        TableName=conversations_table,
        Item={
            "conversationId": {"S": conversation_id},
            "chatId": {"S": chat_id},
            "collectionId": {"S": collection_id},
            "userId": {"S": user_id},
            "timestamp": {"N": str(timestamp)},
            "history": {"S": json.dumps(history)},
            "context": {"S": json.dumps(context)}
        }
    )

    # Record the usage
    usage_url = f"{api_url}/billing/iam/usage"
    usage_request = utils.make_request(usage_url, "POST", json.dumps({
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
            "conversationId": conversation_id,
            "chatId": chat_id,
            "collectionId": collection_id,
            "question": question,
            "response": chat
        })
    }