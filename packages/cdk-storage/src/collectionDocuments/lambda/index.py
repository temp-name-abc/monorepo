import boto3
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Retrieving documents for '{event}'")

    collection_table = os.getenv("COLLECTION_TABLE")
    document_table = os.getenv("DOCUMENT_TABLE")
    document_bucket = os.getenv("DOCUMENT_BUCKET")
    processed_document_bucket = os.getenv("PROCESSED_DOCUMENT_BUCKET")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    collection_id = event["pathParameters"]["collectionId"]

    # Verify the collection
    collection_response = dynamodb_client.get_item(
        TableName=collection_table,
        Key={
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
        FilterExpression="collectionId = :collectionId",
        ExpressionAttributeValues={
            ":collectionId": {"S": collection_id}
        }
    )

    documents = []

    for item in document_response["Items"]:
        document = {}

        document["documentId"] = item["documentId"]["S"]
        document["collectionId"] = item["collectionId"]["S"]
        document["name"] = item["name"]["S"]
        document["type"] = item["type"]["S"]
        document["fileUrl"] = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": document_bucket,
                "Key": document["documentId"],
                "ResponseContentDisposition": f'attachment; filename="{item["name"]["S"]}"'
            },
            ExpiresIn=86400
        )
        document["processedFileUrl"] = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": processed_document_bucket,
                "Key": document["documentId"],
                "ResponseContentDisposition": f'attachment; filename="{item["name"]["S"] + ".PROCESSED.txt"}"'
            },
            ExpiresIn=86400
        )

        documents.append(document)

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