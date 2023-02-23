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
    document_table = os.getenv("DOCUMENT_TABLE")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    body = json.loads(event["body"])
    collection_id = event["pathParameters"]["collectionId"]

    collection_name = body["name"]

    # Verify the collection
    collection_response = dynamodb_client.get_item(
        TableName=collection_table,
        Item={
            "userId": {"S": user_id},
            "collectionId": {"S": collection_id}
        }
    )

    if "Item" not in collection_response:
        msg = f"User '{user_id}' tried to retrieve documents for invalid collection '{collection_id}'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Retrieve the documents for the user
    document_response = dynamodb_client.scan(
        TableName=document_table,
        Item={"collectionId": {"S": collection_id}}
    )

    documents = []

    for item in document_response["Items"]:
        document = {}

        document["documentId"] = item["documentId"]["S"]
        document["name"] = item["name"]["S"]

    logger.info(f"Retrieved documents '{documents}' for collection '{collection_id}' for user '{user_id}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "documents": documents
        })
    }