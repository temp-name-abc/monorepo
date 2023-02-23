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

    # Get a list of user collections
    response = dynamodb_client.scan(
        TableName=collection_table,
        Item={"userId": {"S": user_id}}
    )

    collections = []

    for item in response["Items"]:
        collection = {}

        collection["collectionId"] = item["collectionId"]["S"]
        collection["name"] = item["name"]["S"]

        collections.append(collection)

    logger.info(f"Retrieved collections '{collections}' for '{user_id}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "collections": collections
        })
    }