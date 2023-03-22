import boto3
import os
import json
import logging
import uuid
from datetime import datetime, timedelta
import base64
import requests
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")


def make_request(url, method, data = None):
    session = boto3.session.Session()
    credentials = session.get_credentials()
    region = os.getenv("AWS_REGION")
    service = "execute-api"

    headers = {
        "Content-Type": "application/json"
    }

    http_request = AWSRequest(method=method, url=url, headers=headers, data=data)
    SigV4Auth(credentials, service, region).add_auth(http_request)

    return http_request


def lambda_handler(event, context):
    logger.info(f"Creating file upload request")

    upload_records_table = os.getenv("UPLOAD_RECORDS_TABLE")
    collection_table = os.getenv("COLLECTION_TABLE")
    temp_bucket = os.getenv("TEMP_BUCKET")
    api_url = os.getenv("API_URL")
    max_file_size = int(os.getenv("MAX_FILE_SIZE"))

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    collection_id = event["pathParameters"]["collectionId"]
    body = json.loads(event["body"])

    file_type = body["type"]
    file_name = body["name"]
    file = base64.b64decode(body["file"])

    # Check the file size is not too large
    if len(file) > max_file_size:
        msg = f"User '{user_id}' upload file which exceeded maximum upload size"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Check the filetype is accepted
    accepted_file_types = ["application/pdf", "text/plain", "video/mp4", "audio/mpeg"]

    if file_type not in accepted_file_types:
        msg = f"Invalid file type '{file_type}'. Accepted file types are '{accepted_file_types}'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Check the collection is valid
    response = dynamodb_client.get_item(
        TableName=collection_table,
        Key={
            "userId": {"S": user_id},
            "collectionId": {"S": collection_id}
        }
    )

    if "Item" not in response:
        msg = f"User '{user_id}' tried to upload document to invalid collection '{collection_id}'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Check if the user has subscribed
    active_url = f"{api_url}/billing/iam/status?userId={user_id}"
    active_request = make_request(active_url, "GET")
    active_req = requests.get(active_url, headers=active_request.headers)

    if not active_req.ok or not active_req.json()["active"]:
        logger.error(f"User '{user_id}' has not subscribed with status code '{active_req.status_code}'")

    # Create a new key for the request
    key = str(uuid.uuid4())

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

    # Create a presigned POST URL
    s3_client.put_object(Bucket=temp_bucket, Key=key, Body=file)

    logger.info(f"Created file upload record with key '{key}' for user '{user_id}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        }
    }

