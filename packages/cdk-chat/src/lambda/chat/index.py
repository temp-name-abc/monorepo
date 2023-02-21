import boto3
import json
import os
import logging
import openai
import requests
from datetime import datetime, timedelta
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

logger = logging.getLogger()
logger.setLevel(logging.INFO)

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
    logger.info(f"Processing chat for '{event}'")

    openai_secret = os.getenv("OPENAI_SECRET")
    conversations_table = os.getenv("CONVERSATIONS_TABLE")
    api_url = os.getenv("API_URL")
    product_id = os.getenv("PRODUCT_ID")

    body = json.loads(event["body"])

    # Load and validate parameters
    previous_chat_id = body["previousChatId"] if "previousChatId" in body else None
    collection_id = body["previousChatId"] if "previousChatId" in body else None
    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    query = body["query"]

    if previous_chat_id != None or collection_id != None:
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": "Requires at least one of 'previousChatId' or 'collectionId'"
        }

    # Load the OpenAI API key
    openai.api_key = secrets_manager_client.get_secret_value(SecretId=openai_secret)["SecretString"]

    # Load the previous chat
    prev_chat_response = dynamodb_client.get_item(
        TableName=conversations_table,
        Key={"chatId": {"S": previous_chat_id}}
    )

    if "Item" in prev_chat_response:
        pass

    # Check the user can bill
    active_url = f"{api_url}/billing/iam/status?userId={user_id}&productId={product_id}"
    active_request = make_request(active_url, "GET")
    active_req = requests.get(active_url, headers=active_request.headers)

    if not active_req.ok or not active_req.json()["active"]:
        msg = f"User '{user_id}' has not subscribed to product '{product_id}' with status code '{active_req.status_code}'"

        logger.info(msg)

        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": msg
        }
