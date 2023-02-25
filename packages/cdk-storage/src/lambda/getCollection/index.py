import boto3
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Retrieving collection for '{event}'")

    collection_table = os.getenv("COLLECTION_TABLE")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    collection_id = event["pathParameters"]["collectionId"]

    # Verify the document
    response = dynamodb_client.get_item(
        TableName=collection_table,
        Key={
            "userId": {"S": user_id},
            "collectionId": {"S": collection_id}
        }
    )

    if "Item" not in response:
        msg = f"User '{user_id}' tried to retrieve invalid collection '{collection_id}'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    item = response["Item"]

    # Create signed URL to access document
    logger.info(f"Retrieved collection '{collection_id}' for user '{user_id}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "collectionId": item["collectionId"]["S"],
            "name": item["name"]["S"]
        })
    }