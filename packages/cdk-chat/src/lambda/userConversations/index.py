import boto3
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Retrieving conversations for '{event}'")

    conversation_table = os.getenv("CONVERSATION_TABLE")
    timestamp_index_name = os.getenv("TIMESTAMP_INDEX_NAME")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

    # Get a list of user conversations
    response = dynamodb_client.query(
        TableName=conversation_table,
        IndexName=timestamp_index_name,
        KeyConditionExpression="userId = :userId",
        ExpressionAttributeValues={
            ":userId": {"S": user_id},
        },
        ScanIndexForward=False
    )

    conversations = []

    for item in response["Items"]:
        collection = {}

        collection["conversationId"] = item["conversationId"]["S"]
        collection["name"] = item["name"]["S"]

        conversations.append(collection)

    logger.info(f"Retrieved conversations '{conversations}' for '{user_id}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "conversations": conversations
        })
    }