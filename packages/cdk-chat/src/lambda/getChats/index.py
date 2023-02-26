import boto3
import json
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Retrieving chats for '{event}'")

    conversation_table = os.getenv("CONVERSATION_TABLE")
    chat_table = os.getenv("CHAT_TABLE")
    timestamp_index_name = os.getenv("TIMESTAMP_INDEX_NAME")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    conversation_id = event["pathParameters"]["conversationId"]

    # Verify the conversation
    conversation_response = dynamodb_client.get_item(
        TableName=conversation_table,
        Key={
            "userId": {"S": user_id},
            "conversationId": {"S": conversation_id}
        }
    ) 

    if "Item" not in conversation_response:
        msg = f"User '{user_id}' tried to retrieve chats for invalid conversation '{conversation_id}'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Retrieve chats
    chats_response = dynamodb_client.query(
        TableName=chat_table,
        IndexName=timestamp_index_name,
        KeyConditionExpression="conversationId = :conversationId",
        ExpressionAttributeValues={
            ":conversationId": {"S": conversation_id},
        },
    )

    # Create list of chats
    chats = []

    for item in chats_response["Items"]:
        chat = {}

        chat["conversationId"] = item["conversationId"]["S"]
        chat["chatId"] = item["chatId"]["S"]
        chat["history"] = json.loads(item["history"]["S"])[0:2]
        chat["context"] = json.loads(item["context"]["S"])
        chat["timestamp"] = int(item["timestamp"]["N"])

        chats.append(chat)

    logger.info(f"Retrieved chats '{chats}' for conversation '{conversation_id}' for user '{user_id}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "chats": chats
        })
    }