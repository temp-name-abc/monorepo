import boto3
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Retrieving chats for '{event}'")

    chat_table = os.getenv("CHAT_TABLE")
    timestamp_index_name = os.getenv("TIMESTAMP_INDEX_NAME")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    conversation_id = event["pathParameters"]["conversationId"]
    from_timestamp = event["queryStringParameters"]["fromTimestamp"]

    # Verify the document
    response = dynamodb_client.query(
        TableName=chat_table,
        IndexName=timestamp_index_name,
        KeyConditionExpression="conversationId = :conversationId AND timestamp > :fromTimestamp",
        ExpressionAttributeValues={
            ":conversationId": {"S": conversation_id},
            ":fromTimestamp": {"N": from_timestamp}
        },
        ScanIndexForward=False
    )

    if "Items" not in response or response["Items"][0]["userId"]["S"] != user_id:
        msg = f"User '{user_id}' tried to retrieve invalid chats for conversation '{conversation_id}'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Create list of chats
    chats = []

    for item in response["Items"]:
        chat = {}

        chat["id"] = item["chatId"]["S"]
        chat["context"] = item["context"]["S"]
        chat["timestamp"] = item["timestamp"]["N"]

        prev_chat = json.loads(item["history"]["S"])[-1]
        
        chat["body"] = {}
        chat["body"]["chatId"] = prev_chat["chatId"]
        chat["body"]["human"] = prev_chat["human"]
        chat["body"]["ai"] = prev_chat["ai"]

        chats.append(chat)

    logger.info(f"Retrieved chats '{chats}' for conversation '{conversation_id}' for user '{user_id}'")

    return {
        "statusCode": 302,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "chats": chats
        })
    }