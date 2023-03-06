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
    chunk_table = os.getenv("CHUNK_TABLE")
    chunk_document_index_name = os.getenv("CHUNK_DOCUMENT_INDEX_NAME")

    query_params = event["queryStringParameters"]

    query = query_params["query"]
    user_id = query_params["userId"]
    collection_id = query_params["collectionId"]
    num_results = int(query_params["numResults"])
    extend_down = int(query_params["extendDown"] if "extendDown" in query_params else 0)
    extend_up = int(query_params["extendUp"] if "extendUp" in query_params else 0)
    min_threshold = float(query_params["minThreshold"])

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
        model="text-embedding-ada-002",
        user=user_id
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
        if match["score"] < min_threshold:
            break

        document = {
            "score": match["score"]
        }

        chunk_data = dynamodb_client.get_item(TableName=chunk_table, Key={"chunkId": {"S": match["id"]}})["Item"]

        chunk_num = int(chunk_data["chunkNum"]["N"])

        document["documentId"] = chunk_data["documentId"]["S"]
        document["collectionId"] = chunk_data["collectionId"]["S"]
        document["startChunkNum"] = chunk_num - extend_up
        document["endChunkNum"] = chunk_num + extend_down

        document["body"] = ""

        # Retrieve the chunk range
        chunk_response = dynamodb_client.query(
            TableName=chunk_table,
            IndexName=chunk_document_index_name,
            KeyConditionExpression="documentId = :documentId and chunkNum BETWEEN :minChunkNum and :maxChunkNum",
            ExpressionAttributeValues={
                ":documentId": {"S": document["documentId"]},
                ":minChunkNum": {"N": str(document["startChunkNum"])},
                ":maxChunkNum": {"N": str(document["endChunkNum"])},
            },
        )

        for item in chunk_response["Items"]:
            obj_res = s3_client.get_object(Bucket=chunk_bucket, Key=item["chunkId"]["S"])
            document["body"] += obj_res["Body"].read().decode("utf-8")

        documents.append(document)

    logger.info(f"Processed search query and returned documents '{documents}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(documents)
    }