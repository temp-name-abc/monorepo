import boto3
import os
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Processing file for '{event}'")

    pinecone_secret = os.getenv("PINECONE_SECRET")
    openai_secret = os.getenv("OPENAI_SECRET")
    upload_records_table = os.getenv("UPLOAD_RECORDS_TABLE")
    temp_storage_bucket = os.getenv("TEMP_STORAGE_BUCKET")
    document_table = os.getenv("DOCUMENT_TABLE")
    document_bucket = os.getenv("DOCUMENT_BUCKET")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
    }

