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
    logger.info(f"Creating collection for '{event}'")

    collection_table = os.getenv("COLLECTION_TABLE")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    body = json.loads(event["body"])

    collection_name = body["name"]

    # Additional data required
    collection_id = str(uuid.uuid4())

    now = datetime.utcnow()
    timestamp = int(now.timestamp())

    dynamodb_client.put_item(
        TableName=collection_table,
        Item={
            "userId": {"S": user_id},
            "collectionId": {"S": collection_id},
            "name": {"S": collection_name},
            "timestamp": {"N": str(timestamp)}
        }
    )

    logger.info(f"Created new collection '{collection_id}' for '{user_id}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "collectionId": collection_id,
            "name": collection_name
        })
    }