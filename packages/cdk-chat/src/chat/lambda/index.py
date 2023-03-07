import boto3
import json
import os
import logging
from datetime import datetime
import uuid
import utils

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb_client = boto3.client("dynamodb")
secrets_manager_client = boto3.client("secretsmanager")

model_settings = {"max_tokens": 2048, "temperature": 0.5, "model": "text-davinci-003"}

def make_error(msg):
        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }


def lambda_handler(event, context):
    logger.info(f"Processing answer for '{event}'")

    openai_secret = os.getenv("OPENAI_SECRET")
    conversation_table = os.getenv("CONVERSATION_TABLE")
    chat_table = os.getenv("CHAT_TABLE")
    api_url = os.getenv("API_URL")
    product_id = os.getenv("PRODUCT_ID")
    documents_retrieved = int(os.getenv("DOCUMENTS_RETRIEVED"))
    matching_threshold = float(os.getenv("MATCHING_THRESHOLD"))
    max_characters = int(os.getenv("MAX_CHARACTERS"))
    extend_down = int(os.getenv("EXTEND_DOWN"))

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    conversation_id = event["pathParameters"]["conversationId"]

    body = json.loads(event["body"])

    collection_id = body["collectionId"]
    question = body["question"]

    # Validate inputs
    if len(question) > max_characters:
        msg = f"User '{user_id}' exceeded character limit '{max_characters}'"

        return make_error(msg)

    # Validate conversation
    conversation_response = dynamodb_client.get_item(TableName=conversation_table, Key={"userId": {"S": user_id}, "conversationId": {"S": conversation_id}})

    if "Item" not in conversation_response:
        msg = f"User '{user_id}' tried to chat to invalid conversation '{collection_id}'"

        return make_error(msg)

    # Load the OpenAI API key
    utils.set_openai_api_key(secrets_manager_client.get_secret_value(SecretId=openai_secret)["SecretString"])

    # Initialize
    chat_id = str(uuid.uuid4())
    context = []
    now = datetime.utcnow()
    timestamp = int(now.timestamp())

    # Check the user can be billed
    if not utils.is_billable(api_url, user_id, product_id):
        msg = f"User '{user_id}' has not subscribed to product '{product_id}'"

        return make_error(msg)

    # Figure out what the user is requesting and only answer if safe
    if not utils.is_safe_input(question):
        msg = f"User '{user_id}' sent unsafe text"

        return make_error(msg)

    # Retrieve question context
    documents = utils.get_documents(api_url, question, user_id, collection_id, documents_retrieved, extend_down, matching_threshold)

    if documents == None:
        logger.error(f"Unable to find documents")
    
    elif not documents:
        logger.warning(f"No documents found")
    
    else:
        for document in documents:
            context.append(document)

            logger.info(f"Retrieved context chunk for document '{document['documentId']}'")

    # Generate context, response, and update the history
    chat = utils.generate_chat(question, context, max_characters, user_id)
    logger.info(f"Chat = '{chat}'")

    # Store the data
    dynamodb_client.put_item(
        TableName=chat_table,
        Item={
            "conversationId": {"S": conversation_id},
            "chatId": {"S": chat_id},
            "userId": {"S": user_id},
            "question": {"S": question},
            "answer": {"S": chat},
            "context": {"S": json.dumps(context)},
            "timestamp": {"N": str(timestamp)}
        }
    )

    # Record the usage
    reported = utils.record_usage(api_url, user_id, timestamp, product_id)

    if not reported:
        logger.error(f"Unable to record usage for user '{user_id}' with product '{product_id}'")

    logger.info(f"Generated chat '{chat_id}' for conversation '{conversation_id}' for user '{user_id}'")

    # Return the data
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "conversationId": conversation_id,
            "chatId": chat_id,
            "question": question,
            "answer": chat,
            "context": context,
            "timestamp": timestamp
        })
    }