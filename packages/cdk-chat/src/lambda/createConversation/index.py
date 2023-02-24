import boto3
import json
import os
import logging
from datetime import datetime
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Creating conversation for '{event}'")

    conversation_table = os.getenv("CONVERSATION_TABLE")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    body = json.loads(event["body"])

    conversation_name = body["name"]

    # Additional data required
    conversation_id = str(uuid.uuid4())

    now = datetime.utcnow()
    timestamp = int(now.timestamp())

    dynamodb_client.put_item(
        TableName=conversation_table,
        Item={
            "userId": {"S": user_id},
            "conversationId": {"S": conversation_id},
            "name": {"S": conversation_name},
            "timestamp": {"N": str(timestamp)}
        }
    )

    logger.info(f"Created new conversation '{conversation_id}' for '{user_id}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "conversationId": conversation_id
        })
    }