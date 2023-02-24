import boto3
import json
import os
import logging
import requests
from datetime import datetime
import uuid
import urllib.parse
import utils

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb_client = boto3.client("dynamodb")
secrets_manager_client = boto3.client("secretsmanager")

model_settings = {"max_tokens": 2048, "temperature": 0.5, "model": "text-davinci-003"}


def lambda_handler(event, context):
    logger.info(f"Processing answer for '{event}'")

    openai_secret = os.getenv("OPENAI_SECRET")
    conversation_table = os.getenv("CONVERSATION_TABLE")
    chat_table = os.getenv("CHAT_TABLE")
    api_url = os.getenv("API_URL")
    product_id = os.getenv("PRODUCT_ID")
    memory_size = int(os.getenv("MEMORY_SIZE"))

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    conversation_id = event["pathParameters"]["conversationId"]

    body = json.loads(event["body"])

    prev_chat_id = body["chatId"] if "chatId" in body else None
    collection_id = body["collectionId"] if "collectionId" in body else None
    question = body["question"]

    # Load the OpenAI API key
    utils.set_openai_api_key(secrets_manager_client.get_secret_value(SecretId=openai_secret)["SecretString"])

    # Check the conversation is valid
    response = dynamodb_client.get_item(
        TableName=conversation_table,
        Key={
            "userId": {"S": user_id},
            "conversationId": {"S": conversation_id}
        }
    )

    if "Item" not in response:
        msg = f"User '{user_id}' tried to chat to invalid conversation '{collection_id}'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Load the chat history
    chat_id = str(uuid.uuid4())
    history = []
    context = []

    now = datetime.utcnow()
    timestamp = int(now.timestamp())

    if prev_chat_id != None:
        prev_chat_data = dynamodb_client.get_item(
            TableName=chat_table,
            Key={
                "conversationId": {"S": conversation_id},
                "chatId": {"S": prev_chat_id}
                }
        )["Item"]

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

    # Figure out the question
    query_prompt = utils.prompt_query(conversation_text, question)
    query, query_tokens = utils.generate_text(query_prompt)

    tokens += query_tokens
    logger.info(f"Query prompt = '{query_prompt}', response = '{query}'")

    # Check if there is enough context
    enough_info_prompt = utils.prompt_enough_info(context_text, query)
    enough_info, enough_info_tokens = utils.generate_text(enough_info_prompt)

    tokens += enough_info_tokens
    logger.info(f"Enough info prompt = '{enough_info_prompt}', response = '{enough_info}'")

    if "yes" not in enough_info.lower() and collection_id != None:
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
            context_text = utils.create_context(context) # First context document could contain the information
            context = context[len(context) - memory_size:]

            logger.info(f"Retrieved context document '{document['id']}'")

    # Update the context, generate the response, and update the history
    chat_prompt = utils.prompt_chat(context_text, conversation_text, question)
    chat, chat_tokens = utils.generate_text(chat_prompt)

    tokens += chat_tokens
    logger.info(f"Chat prompt = '{chat_prompt}', response = '{chat}'")

    history.append({"human": question, "ai": chat, "chatId": chat_id})
    history = history[len(history) - memory_size:]

    # Store the data
    item = {
        "conversationId": {"S": conversation_id},
        "chatId": {"S": chat_id},
        "userId": {"S": user_id},
        "history": {"S": json.dumps(history)},
        "context": {"S": json.dumps(context)},
        "timestamp": {"N": str(timestamp)}
    }

    if collection_id != None:
        item["collectionId"] = {"S": collection_id}

    dynamodb_client.put_item(
        TableName=chat_table,
        Item=item
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

    logger.info(f"Generated chat '{chat_id}' for conversation '{conversation_id}' for user '{user_id}'")

    # Return the data
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "chatId": chat_id,
            "question": question,
            "response": chat,
            "context": context
        })
    }