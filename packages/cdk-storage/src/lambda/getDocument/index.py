import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Retrieving document for '{event}'")

    document_table = os.getenv("DOCUMENT_TABLE")
    document_bucket = os.getenv("DOCUMENT_BUCKET")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    collection_id = event["pathParameters"]["collectionId"]
    document_id = event["pathParameters"]["documentId"]

    # Verify the document
    response = dynamodb_client.get_item(
        TableName=document_table,
        Key={
            "collectionId": {"S": collection_id},
            "documentId": {"S": document_id}
        }
    )

    if "Item" not in response or response["Item"]["userId"]["S"] != user_id:
        msg = f"User '{user_id}' tried to retrieve document for invalid collection '{collection_id}'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Create signed URL to access document
    url = s3_client.generate_presigned_url("get_object", Params={"Bucket": document_bucket, "Key": document_id}, ExpiresIn=86400)

    logger.info(f"Retrieved document '{document_id}' for collection '{collection_id}' for user '{user_id}'")

    return {
        "statusCode": 302,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Location": url
        },
    }