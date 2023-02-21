import boto3
import os
import logging
import openai
import pinecone

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

        # **** If the record has already been processed then ignore it

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
    }

