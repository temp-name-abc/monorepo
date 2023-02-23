import boto3
import os
import json
import logging
import uuid
from datetime import datetime, timedelta

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Creating file upload request for '{event}'")

    upload_records_table = os.getenv("UPLOAD_RECORDS_TABLE")
    document_bucket = os.getenv("DOCUMENT_BUCKET")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    collection_id = event["pathParameters"]["collectionId"]
    body = json.loads(event["body"])

    file_type = body["type"]
    file_name = body["name"]

    # Create a new key for the request
    key = str(uuid.uuid4())

    # Upload a key with the user id
    now = datetime.utcnow()
    expiry_time = now + timedelta(days=1)
    ttl_seconds = int(expiry_time.timestamp())

    dynamodb_client.put_item(
        TableName=upload_records_table,
        Item={
            "uploadId": {"S": key},
            "userId": {"S": user_id},
            "collectionId": {"S": collection_id},
            "name": {"S": file_name},
            "type": {"S": file_type},
            "ttl": {"N": str(ttl_seconds)}
        },
        ConditionExpression="attribute_not_exists(uploadId)"
    )

    # Create a presigned PUT URL
    response = s3_client.generate_presigned_post(
        Bucket=document_bucket,
        Key=key,
        ExpiresIn=86400
    )

    logger.info(f"Created file upload record with key '{key}' for user '{user_id}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(response)
    }

