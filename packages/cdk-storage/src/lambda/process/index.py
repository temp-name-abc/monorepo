import boto3
import json
import os
import logging
import openai
import pinecone
import requests
import uuid
from datetime import datetime, timedelta
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")
secrets_manager_client = boto3.client("secretsmanager")

model_settings = {"model": "text-embedding-ada-002"}


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
    upload_lock_table = os.getenv("UPLOAD_LOCK_TABLE")
    document_table = os.getenv("DOCUMENT_TABLE")
    chunk_table = os.getenv("CHUNK_TABLE")
    chunk_bucket = os.getenv("CHUNK_BUCKET")
    api_url = os.getenv("API_URL")
    product_id = os.getenv("PRODUCT_ID")
    chunk_size = int(os.getenv("CHUNK_SIZE"))

    # Load the OpenAI API key
    openai.api_key = secrets_manager_client.get_secret_value(SecretId=openai_secret)["SecretString"]

    # Load the Pinecone API key
    pinecone_data = json.loads(secrets_manager_client.get_secret_value(SecretId=pinecone_secret)["SecretString"])

    pinecone_api_key = pinecone_data["apiKey"]
    pinecone_env = pinecone_data["env"]
    pinecone_index = pinecone_data["index"]

    pinecone.init(
        api_key=pinecone_api_key,
        environment=pinecone_env
    )

    index = pinecone.Index(pinecone_index)

    # Process records
    for record in event["Records"]:
        document_id = record["s3"]["object"]["key"]
        bucket_name = record["s3"]["bucket"]["name"]

        # Lock the upload temporarily
        now = datetime.utcnow()
        timestamp = int(now.timestamp())
        expiry_time = now + timedelta(minutes=10)
        ttl_seconds = int(expiry_time.timestamp())

        dynamodb_client.put_item(
            TableName=upload_lock_table,
            Item={
                "uploadId": {"S": document_id},
                "ttl": {"N": str(ttl_seconds)}
            },
            ConditionExpression="attribute_not_exists(uploadId)"
        )

        # Get the upload document
        upload_data = dynamodb_client.get_item(
            TableName=upload_records_table,
            Key={
                "uploadId": {"S": document_id}
            }
        )["Item"]

        user_id = upload_data["userId"]["S"]
        collection_id = upload_data["collectionId"]["S"]
        name = upload_data["name"]["S"]
        file_type = upload_data["type"]["S"]

        # Check if the user has subscribed
        active_url = f"{api_url}/billing/iam/status?userId={user_id}&productId={product_id}"
        active_request = make_request(active_url, "GET")
        active_req = requests.get(active_url, headers=active_request.headers)

        if not active_req.ok or not active_req.json()["active"]:
            logger.error(f"User '{user_id}' has not subscribed to product '{product_id}' with status code '{active_req.status_code}'")

            continue
        
        # Retrieve document text
        obj_res = s3_client.get_object(Bucket=bucket_name, Key=document_id)
        body = obj_res["Body"].read().decode("utf-8", errors="ignore")

        # Write the uploaded document to the document table
        dynamodb_client.put_item(
            TableName=document_table,
            Item={
                "collectionId": {"S": collection_id},
                "documentId": {"S": document_id},
                "userId": {"S": user_id},
                "name": {"S": name},
                "type": {"S": file_type},
                "timestamp": {"S": str(timestamp)} 
            }
        )

        # Record the chunks of the document for indexing
        words = body.split(" ")
        tokens = 0

        while len(words) > 0:
            chunk_id = str(uuid.uuid4())
            chunk = " ".join(words[:chunk_size])

            # Create the embeddings
            embeddings_response = openai.Embedding.create(input=chunk, **model_settings)
            embeddings = embeddings_response["data"][0]["embedding"]
            tokens += embeddings_response["usage"]["total_tokens"]

            # Store pinecone embeddings with a composite key
            index.upsert([
                (chunk_id, embeddings, {"userId": user_id, "collectionId": collection_id, "documentId": document_id})
            ])

            # Upload text to S3
            s3_client.put_object(Bucket=chunk_bucket, Key=chunk_id, Body=chunk)

            # Update the resource
            dynamodb_client.put_item(
                TableName=chunk_table,
                Item={
                    "chunkId": {"S": chunk_id},
                    "collectionId": {"S": collection_id},
                    "documentId": {"S": document_id},
                    "userId": {"S": user_id},
                    "embedding": {"S": json.dumps(embeddings)},
                    "timestamp": {"N": str(timestamp)}
                }
            )

            words = words[chunk_size:]

            logger.info(f"Stored chunk '{chunk_id}' of document '{document_id}' in collection '{collection_id}'")

        # Record usage for user
        usage_url = f"{api_url}/billing/iam/usage"
        usage_request = make_request(usage_url, "POST", json.dumps({
            "userId": user_id,
            "timestamp": timestamp,
            "productId": product_id,
            "quantity": tokens
        }))
        usage_req = requests.post(
            usage_url,
            headers=usage_request.headers,
            data=usage_request.data
        )

        if not usage_req.ok:
            logger.warning(f"Unable to record usage for user '{user_id}' with product '{product_id}' with status code '{usage_req.status_code}'")

        logger.info(f"Processed file with key '{document_id}'")