import boto3
import json
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
    logger.info(f"Querying database for '{event}'")

    logger.info(f"Processing files for '{event}'")

    pinecone_secret = os.getenv("PINECONE_SECRET")
    openai_secret = os.getenv("OPENAI_SECRET")
    collection_table = os.getenv("COLLECTION_TABLE")
    chunk_bucket = os.getenv("CHUNK_BUCKET")
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

    # Check that the user owns the collection
    user_response = dynamodb_client.get_item(
        TableName=collection_table,
        Key={
            "userId": {"S": user_id},
            "collectionId": {"S": collection_id}
        }
    )

    if "Item" not in user_response:
        msg = f"Invalid collection '{collection_id}' for user '{user_id}'"

        logger.error(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }

    # Find matching documents
    embeddings = openai.Embedding.create(
        input=query,
        model="text-embedding-ada-002"
    )["data"][0]["embedding"]

    query_response = index.query(
        vector=embeddings,
        top_k=num_results,
        filter={
            "userId": user_id,
            "collectionId": collection_id
        },
        include_metadata=True
    )

    # Return a list of documents with their metadata
    documents = []

    for match in query_response["matches"]:
        document = {}

        chunk_id = match["id"]
        document["score"] = match["score"]
        document["documentId"] = match["metadata"]["documentId"]

        obj_res = s3_client.get_object(Bucket=chunk_bucket, Key=chunk_id)
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