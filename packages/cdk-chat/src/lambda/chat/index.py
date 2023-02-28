import boto3
import json
import os
import logging
import requests
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
    context_memory_size = int(os.getenv("CONTEXT_MEMORY_SIZE"))
    chat_memory_size = int(os.getenv("CHAT_MEMORY_SIZE"))
    documents_retrieved = int(os.getenv("DOCUMENTS_RETRIEVED"))
    matching_threshold = float(os.getenv("MATCHING_THRESHOLD"))
    max_characters = int(os.getenv("MAX_CHARACTERS"))

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    conversation_id = event["pathParameters"]["conversationId"]

    body = json.loads(event["body"])

    prev_chat_id = body["chatId"] if "chatId" in body else None
    collection_id = body["collectionId"] if "collectionId" in body else None
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

    # Load the chat history
    chat_id = str(uuid.uuid4())
    history = []
    context = []

    now = datetime.utcnow()
    timestamp = int(now.timestamp())

    if prev_chat_id != None:
        prev_chat_data = dynamodb_client.get_item(TableName=chat_table, Key={"conversationId": {"S": conversation_id}, "chatId": {"S": prev_chat_id}})["Item"]

        history = json.loads(prev_chat_data["history"]["S"])
        context = json.loads(prev_chat_data["context"]["S"])

        logger.info(f"Loaded previous chat '{prev_chat_id}'")

    # Check the user can be billed
    billable = utils.is_billable(api_url, user_id, product_id)

    if not billable:
        msg = f"User '{user_id}' has not subscribed to product '{product_id}'"

        return make_error(msg)

    # Get the conversation
    conversation_text = utils.create_conversation(history)
    context_text = utils.create_context(context)

    # Figure out the question
    query_prompt = utils.prompt_query(conversation_text, question)
    query = utils.generate_text(query_prompt, max_characters)
    logger.info(f"Query prompt = '{query_prompt}', response = '{query}'")

    # Check if there is enough context
    query_context_similarity = utils.query_similarity(context_text, query)
    logger.info(f"Similarity = '{query_context_similarity}'")

    if query_context_similarity < matching_threshold and collection_id != None:
        context = context[max(len(context) - context_memory_size + documents_retrieved, 0):]

        documents = utils.get_documents(api_url, query, user_id, collection_id, documents_retrieved + context_memory_size)

        if documents == None:
            logger.error(f"Unable to find documents")
        
        elif not documents:
            logger.warning(f"No documents found")
        
        else:
            chunks = {document["chunkId"]: True for document in context}
            retrieved = 0

            for document in documents:
                if document["score"] < matching_threshold or retrieved == documents_retrieved:
                    break

                if document["chunkId"] in chunks:
                    continue

                context.append({
                    "body": document["body"],
                    "documentId": document["documentId"],
                    "collectionId": collection_id,
                    "chunkId": document["chunkId"],
                    "score": document["score"]
                })

                chunks[document["chunkId"]] = True

                logger.info(f"Retrieved context chunk '{document['chunkId']}' for document '{document['documentId']}'")

                retrieved += 1

            context_text = utils.create_context(context)

    # Generate the response and update the history
    chat_prompt = utils.prompt_chat(context_text, conversation_text, question)
    chat = utils.generate_text(chat_prompt, max_characters)
    logger.info(f"Chat prompt = '{chat_prompt}', response = '{chat}'")

    history.append({"human": question, "ai": chat, "chatId": chat_id})
    history = history[max(len(history) - chat_memory_size, 0):]

    # Store the data
    dynamodb_client.put_item(
        TableName=chat_table,
        Item={
            "conversationId": {"S": conversation_id},
            "chatId": {"S": chat_id},
            "userId": {"S": user_id},
            "history": {"S": json.dumps(history)},
            "context": {"S": json.dumps(context)},
            "timestamp": {"N": str(timestamp)}
        }
    )

    # Record the usage
    reported = utils.record_usage(api_url, user_id, timestamp, product_id, question)

    if not reported:
        logger.warning(f"Unable to record usage for user '{user_id}' with product '{product_id}'")

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
            "history": history[max(len(history) - 2, 0):],
            "context": context,
            "timestamp": timestamp
        })
    }