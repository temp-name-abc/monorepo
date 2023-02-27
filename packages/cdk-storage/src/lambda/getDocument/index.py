import boto3
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Retrieving document for '{event}'")

    collection_table = os.getenv("COLLECTION_TABLE")
    document_table = os.getenv("DOCUMENT_TABLE")
    document_bucket = os.getenv("DOCUMENT_BUCKET")
    processed_document_bucket = os.getenv("PROCESSED_DOCUMENT_BUCKET")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    collection_id = event["pathParameters"]["collectionId"]
    document_id = event["pathParameters"]["documentId"]

    # Verify the collection
    collection_response = dynamodb_client.get_item(
        TableName=collection_table,
        Key={
            "userId": {"S": user_id},
            "collectionId": {"S": collection_id}
        }
    )

    if "Item" not in collection_response:
        msg = f"User '{user_id}' tried to retrieve document for invalid collection '{collection_id}'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Retrieve the document for the user
    document_response = dynamodb_client.get_item(
        TableName=document_table,
        Key={
            "collectionId": {"S": collection_id},
            "documentId": {"S": document_id},
        }
    )["Item"]

    document = {}

    document["documentId"] = document_id
    document["name"] = document_response["name"]["S"]
    document["type"] = document_response["type"]["S"]
    document["fileUrl"] = s3_client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": document_bucket,
            "Key": document_id,
            "ResponseContentDisposition": f'attachment; filename="{document_response["name"]["S"]}"'
        },
        ExpiresIn=86400
    )
    document["processedFileUrl"] = s3_client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": processed_document_bucket,
            "Key": document["documentId"],
            "ResponseContentDisposition": f'attachment; filename="{document_response["name"]["S"] + ".PROCESSED.txt"}"'
        },
        ExpiresIn=86400
    )

    logger.info(f"Retrieved document '{document_id}' for collection '{collection_id}' for user '{user_id}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(document)
    }