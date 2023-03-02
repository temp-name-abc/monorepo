import boto3
import json
import os
import logging
import pinecone

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")
secrets_manager_client = boto3.client("secretsmanager")


def lambda_handler(event, context):
    logger.info(f"Deleting document for '{event}'")

    pinecone_secret = os.getenv("PINECONE_SECRET")
    document_table = os.getenv("DOCUMENT_TABLE")
    document_bucket = os.getenv("DOCUMENT_BUCKET")
    processed_document_bucket = os.getenv("PROCESSED_DOCUMENT_BUCKET")
    chunk_table = os.getenv("CHUNK_TABLE")
    chunk_index_name = os.getenv("CHUNK_INDEX_NAME")
    chunk_bucket = os.getenv("CHUNK_BUCKET")


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

    for record in event["Records"]:
        body = json.loads(record["body"])

        user_id = body["userId"]

        path_params = body["pathParams"].strip("{}").split(", ")

        collection_id = path_params[0].split("=")[1]
        document_id = path_params[1].split("=")[1]

        # Check the user id is valid
        document_response = dynamodb_client.get_item(
            TableName=document_table,
            Key={
                "collectionId": {"S": collection_id},
                "documentId": {"S": document_id}
            }
        )

        if "Item" not in document_response or document_response["Item"]["userId"]["S"] != user_id:
            continue

        # Retrieve all document chunks
        chunk_response = dynamodb_client.query(
            TableName=chunk_table,
            IndexName=chunk_index_name,
            KeyConditionExpression="documentId = :documentId",
            ExpressionAttributeValues={
                ":documentId": {"S": document_id},
            },
        )

        items = chunk_response["Items"]

        while "LastEvaluatedKey" in chunk_response:
            chunk_response = dynamodb_client.query(
                TableName=chunk_table,
                IndexName=chunk_index_name,
                KeyConditionExpression="documentId = :documentId",
                ExpressionAttributeValues={
                    ":documentId": {"S": document_id},
                },
                ExclusiveStartKey=chunk_response["LastEvaluatedKey"]
            )

            items.extend(chunk_response["Items"])

        # Delete each chunk
        for item in items:
            chunk_id = item["chunkId"]["S"]

            index.delete(ids=[chunk_id])

            s3_client.delete_object(Bucket=chunk_bucket, Key=chunk_id)

            dynamodb_client.delete_item(TableName=chunk_table, Key={"chunkId": {"S": chunk_id}})

            logger.info(f"Deleted chunk '{chunk_id}' for document '{document_id}'")

        # Delete the objects
        s3_client.delete_object(Bucket=processed_document_bucket, Key=document_id)
        s3_client.delete_object(Bucket=document_bucket, Key=document_id)

        # Delete the item
        dynamodb_client.delete_item(TableName=document_table, Key={"collectionId": {"S": collection_id}, "documentId": {"S": document_id}})

        logger.info(f"Deleted document '{document_id}'")