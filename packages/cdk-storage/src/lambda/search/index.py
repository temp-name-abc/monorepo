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


def lambda_handler(event, context):
    logger.info(f"Querying database for '{event}'")

    logger.info(f"Processing files for '{event}'")

    pinecone_secret = os.getenv("PINECONE_SECRET")
    openai_secret = os.getenv("OPENAI_SECRET")
    document_bucket = os.getenv("DOCUMENT_BUCKET")
    pinecone_env = os.getenv("PINECONE_ENV")
    pinecone_index = os.getenv("PINECONE_INDEX")

    query_params = event["queryStringParameters"]

    query = query_params["query"]
    user_id = query_params["userId"]
    collection_id = query_params["collectionId"]
    num_results = int(query_params["numResults"])

    # Load the OpenAI API key
    openai.api_key = secrets_manager_client.get_secret_value(SecretId=openai_secret)["SecretString"]

    # Load the Pinecone API key
    pinecone_api_key = secrets_manager_client.get_secret_value(SecretId=pinecone_secret)["SecretString"]

    pinecone.init(
        api_key=pinecone_api_key,
        environment=pinecone_env
    )

    index = pinecone.Index(pinecone_index)

    # Find matching documents
    embeddings = openai.Embedding.create(
        input=query,
        model="text-embedding-ada-002"
    )["data"][0]["embedding"]

    response = index.query(
        vector=embeddings,
        top_k=num_results,
        filter={
            "userId": user_id,
            "collectionId": collection_id
        }
    )

    # Return a list of documents with their metadata
    documents = []

    for match in response["matches"]:
        document = {}

        document["id"] = match["id"]
        document["score"] = match["score"]

        obj_res = s3_client.get_object(Bucket=document_bucket, Key=match["id"])
        body = obj_res["Body"].read().decode("utf-8")

        document["body"] = body

        documents.append(document)

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(documents)
    }