import boto3
import json
import os
import logging
import openai
import pinecone
import requests
from datetime import datetime, timedelta

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")
secrets_manager_client = boto3.client("secretsmanager")


def lambda_handler(event, context):
    logger.info(f"Processing files for '{event}'")

    pinecone_secret = os.getenv("PINECONE_SECRET")
    openai_secret = os.getenv("OPENAI_SECRET")
    upload_records_table = os.getenv("UPLOAD_RECORDS_TABLE")
    temp_storage_bucket = os.getenv("TEMP_STORAGE_BUCKET")
    document_table = os.getenv("DOCUMENT_TABLE")
    document_bucket = os.getenv("DOCUMENT_BUCKET")
    api_url = os.getenv("API_URL")
    pinecone_env = os.getenv("PINECONE_ENV")
    product_id = os.getenv("PRODUCT_ID")

    # Load the OpenAI API key
    openai.api_key = secrets_manager_client.get_secret_value(SecretId=openai_secret)["SecretString"]

    # Load the Pinecone API key
    pinecone_api_key = secrets_manager_client.get_secret_value(SecretId=pinecone_secret)["SecretString"]

    pinecone.init(
        api_key=pinecone_api_key,
        environment=pinecone_env
    )

    # Process records
    for record in event["Records"]:
        key = record["s3"]["object"]["key"]
        timestamp = int(now.timestamp())

        # Create a record to lock the resource temporarily
        now = datetime.utcnow()
        expiry_time = now + timedelta(minutes=15)
        ttl_seconds = int(expiry_time.timestamp())

        dynamodb_client.put_item(
            TableName=document_table,
            Item={
                "documentId": {"S": key},
                "ttl": {"N": str(ttl_seconds)},
                "status": {"S": "in_progress"}
            },
            ConditionExpression="attribute_not_exists(documentId)"
        )

        # Get the upload data
        upload_data = dynamodb_client.get_item(
            TableName=upload_records_table,
            Key={"uploadId": {"S": key}}
        )["Item"]

        user_id = upload_data["userId"]["S"]

        # Check if the user has subscribed
        r = requests.get(f"{api_url}/billing/iam/status?userId={user_id}&productId={product_id}")
        if not r.ok or not r.json()["active"]:
            logger.info(f"User '{user_id}' has not subscribed to product '{product_id}'")
            continue

        # Record usage for user
        r = requests.post(f"{api_url}/billing/iam/usage", data={
            "userId": user_id,
            "timestamp": timestamp,
            "productId": product_id
        })
        if not r.ok:
            logger.info(f"Unable to record usage for user '{user_id}' with product '{product_id}'")
            continue

        # Retrieve the text and store it in S3
        obj_res = s3_client.get_object(Bucket=temp_storage_bucket, Key=key)
        body = obj_res["Body"].read().decode("utf-8")

        # Create the embeddings and store in Pinecone
        embeddings = openai.Embedding.create(
            input=body,
            model="text-embedding-ada-002"
        )["data"][0]["embedding"]

        # Update the resource
        dynamodb_client.put_item(
            TableName=document_table,
            Item={
                "documentId": {"S": key},
                "status": {"S": "success"},
                "timestamp": {"N": str(timestamp)},
                "embedding": {"S": json.dumps(embeddings)}
            },
        )

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
    }

