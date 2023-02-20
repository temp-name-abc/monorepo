import boto3
import json
import os
import logging
import stripe

logger = logging.getLogger()
logger.setLevel(logging.INFO)

secrets_manager_client = boto3.client("secretsmanager")
dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Create dashboard link for '{event}'")

    secret_name = os.getenv("SECRET_NAME")
    partner_table = os.getenv("PARTNER_TABLE")

    username = event["requestContext"]["authorizer"]["claims"]["sub"]

    # Load the Stripe key
    secret_raw = secrets_manager_client.get_secret_value(SecretId=secret_name)
    secret = json.loads(secret_raw["SecretString"])

    stripe.api_key = secret["STRIPE_KEY_SECRET"]

    # Get the users stripe account
    account_response = dynamodb_client.get_item(
        TableName=partner_table,
        Key={"userId": username}
    )

    account_id = account_response["Item"]["accountId"]["S"]

    # Create a new login session
    session = stripe.Account.create_login_link(account_id)

    logger.info(f"Created partner dashboard session for user '{username}'")

    return {
        "statusCode": 302,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Location": session["url"]
        }
    }