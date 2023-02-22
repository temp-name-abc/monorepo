import boto3
import json
import os
import logging
import openai
import pinecone
import requests
from datetime import datetime, timedelta
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")
secrets_manager_client = boto3.client("secretsmanager")


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
    logger.info(f"Processing files for '{event}'")

    pinecone_secret = os.getenv("PINECONE_SECRET")
    openai_secret = os.getenv("OPENAI_SECRET")
    upload_records_table = os.getenv("UPLOAD_RECORDS_TABLE")
    document_table = os.getenv("DOCUMENT_TABLE")
    document_bucket = os.getenv("DOCUMENT_BUCKET")
    api_url = os.getenv("API_URL")
    pinecone_env = os.getenv("PINECONE_ENV")
    pinecone_index = os.getenv("PINECONE_INDEX")
    product_id = os.getenv("PRODUCT_ID")

    # Load the OpenAI API key
    openai.api_key = secrets_manager_client.get_secret_value(SecretId=openai_secret)["SecretString"]

    # Load the Pinecone API key
    pinecone_api_key = secrets_manager_client.get_secret_value(SecretId=pinecone_secret)["SecretString"]

    pinecone.init(
        api_key=pinecone_api_key,
        environment=pinecone_env
    )

    index = pinecone.Index(pinecone_index)

    # Process records
    for record in event["Records"]:
        key = record["s3"]["object"]["key"]
        bucket_name = record["s3"]["bucket"]["name"]

        # Create a record to lock the resource temporarily
        now = datetime.utcnow()
        timestamp = int(now.timestamp())
        expiry_time = now + timedelta(minutes=15)
        ttl_seconds = int(expiry_time.timestamp())

        # Get the upload data
        upload_data = dynamodb_client.get_item(
            TableName=upload_records_table,
            Key={"uploadId": {"S": key}}
        )["Item"]

        user_id = upload_data["userId"]["S"]
        collection_id = upload_data["collectionId"]["S"]

        dynamodb_client.put_item(
            TableName=document_table,
            Item={
                "documentId": {"S": key},
                "collectionId": {"S": collection_id},
                "userId": {"S": user_id},
                "status": {"S": "in_progress"},
                "ttl": {"N": str(ttl_seconds)}
            },
            ConditionExpression="attribute_not_exists(documentId)"
        )

        # Check if the user has subscribed
        active_url = f"{api_url}/billing/iam/status?userId={user_id}&productId={product_id}"
        active_request = make_request(active_url, "GET")
        active_req = requests.get(active_url, headers=active_request.headers)

        if not active_req.ok or not active_req.json()["active"]:
            logger.error(f"User '{user_id}' has not subscribed to product '{product_id}' with status code '{active_req.status_code}'")

            continue
        
        # Retrieve document text
        obj_res = s3_client.get_object(Bucket=bucket_name, Key=key)
        body = obj_res["Body"].read().decode("utf-8")

        # Create the embeddings and store in Pinecone
        embeddings = openai.Embedding.create(
            input=body,
            model="text-embedding-ada-002"
        )["data"][0]["embedding"]

        index.upsert([
            (key, embeddings, {"userId": user_id, "collectionId": collection_id})
        ])

        # Upload text to S3
        s3_client.put_object(Bucket=document_bucket, Key=key, Body=body)

        # Update the resource
        dynamodb_client.put_item(
            TableName=document_table,
            Item={
                "documentId": {"S": key},
                "collectionId": {"S": collection_id},
                "userId": {"S": user_id},
                "status": {"S": "success"},
                "timestamp": {"N": str(timestamp)},
                "embedding": {"S": json.dumps(embeddings)},
            }
        )

        # Record usage for user
        usage_url = f"{api_url}/billing/iam/usage"
        usage_request = make_request(usage_url, "POST", json.dumps({
            "userId": user_id,
            "timestamp": timestamp,
            "productId": product_id,
            "quantity": len(body) // 4
        }))
        usage_req = requests.post(
            usage_url,
            headers=usage_request.headers,
            data=usage_request.data
        )

        if not usage_req.ok:
            logger.warning(f"Unable to record usage for user '{user_id}' with product '{product_id}' with status code '{usage_req.status_code}'")

        logger.info(f"Processed file with key '{key}'")