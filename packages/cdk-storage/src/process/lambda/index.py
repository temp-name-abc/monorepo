import boto3
import json
import os
import logging
import openai
import pinecone
import requests
from datetime import datetime
import PyPDF2
import hashlib
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
import io

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
    processed_document_bucket = os.getenv("PROCESSED_DOCUMENT_BUCKET")
    chunk_table = os.getenv("CHUNK_TABLE")
    chunk_bucket = os.getenv("CHUNK_BUCKET")
    api_url = os.getenv("API_URL")
    storage_per_char_product_id = os.getenv("STORAGE_PER_CHAR_PRODUCT_ID")
    chunk_characters = int(os.getenv("CHUNK_CHARACTERS"))

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
        upload_id = record["s3"]["object"]["key"]
        temp_bucket_name = record["s3"]["bucket"]["name"]

        now = datetime.utcnow()
        timestamp = int(now.timestamp())

        # Get the upload document
        upload_data = dynamodb_client.get_item(TableName=upload_records_table, Key={"uploadId": {"S": upload_id}})["Item"]

        user_id = upload_data["userId"]["S"]
        collection_id = upload_data["collectionId"]["S"]
        name = upload_data["name"]["S"]
        file_type = upload_data["type"]["S"]

        # Retrieve document text and generate id
        obj_res = s3_client.get_object(Bucket=temp_bucket_name, Key=upload_id)
        raw_body = obj_res["Body"].read()
        body = ""

        document_id = hashlib.sha256(f"{user_id}:{collection_id}:{hashlib.sha256(raw_body).hexdigest()}".encode()).hexdigest() 

        # If the document exists then skip
        document_response = dynamodb_client.get_item(TableName=document_table, Key={"collectionId": {"S": collection_id}, "documentId": {"S": document_id}})

        if "Item" in document_response:
            logger.info(f"Document '{document_id}' already exists - skipping")

            continue

        # Process supported file types
        if file_type == "text/plain":
            body = raw_body.decode("utf-8", errors="ignore")

            logger.info("Processed text file")

        elif file_type == "application/pdf":
            pdfreader = PyPDF2.PdfReader(io.BytesIO(raw_body))

            for page in pdfreader.pages:
                text = page.extract_text()

                body += text + " "

            logger.info("Processed pdf")
            
        else:
            logger.error(f"Document '{document_id}' has unsupported file type '{file_type}'")

            continue

        # Check the uploaded document is safe
        is_flagged = openai.Moderation.create(input=body)["results"][0]["flagged"]

        if is_flagged:
            logger.error(f"User '{user_id}' uploaded unsafe document")

            continue

        # Record the chunks of the document for indexing
        remaining = body
        chunk_num = 0

        while remaining:
            chunk = remaining[:chunk_characters]
            chunk_id = hashlib.sha256(f"{document_id}:{chunk}".encode()).hexdigest()
            chunk_num += 1

            # Skip if the chunk exists
            chunk_response = dynamodb_client.get_item(TableName=chunk_table, Key={"chunkId": {"S": chunk_id}})

            if "Item" in chunk_response:
                logger.info(f"Chunk '{chunk_id}' already exists - skipping")

                continue

            # Create the embeddings
            embeddings_response = openai.Embedding.create(input=chunk, model="text-embedding-ada-002", user=user_id)
            embeddings = embeddings_response["data"][0]["embedding"]

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
                    "chunkNum": {"N": str(chunk_num)},
                    "timestamp": {"N": str(timestamp)}
                }
            )

            remaining = remaining[chunk_characters:]

            logger.info(f"Stored chunk '{chunk_id}' of document '{document_id}' in collection '{collection_id}'")

        # Write the uploaded document to main storage
        s3_client.put_object(Bucket=document_bucket, Key=document_id, Body=raw_body)
        s3_client.put_object(Bucket=processed_document_bucket, Key=document_id, Body=body)

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

        # Record usage for user
        usage_url = f"{api_url}/billing/iam/usage"
        usage_request = make_request(usage_url, "POST", json.dumps({
            "userId": user_id,
            "usage": [
                {
                    "timestamp": timestamp,
                    "productId": storage_per_char_product_id,
                    "quantity": len(body)
                }
            ]
        }))
        usage_req = requests.post(
            usage_url,
            headers=usage_request.headers,
            data=usage_request.data
        )

        if not usage_req.ok:
            logger.error(f"Unable to record usage for user '{user_id}' with status code '{usage_req.status_code}'")

        logger.info(f"Processed file with key '{document_id}'")