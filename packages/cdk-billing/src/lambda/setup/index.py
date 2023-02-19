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
    secret_name = os.getenv("SECRET_NAME")
    user_billing_table = os.getenv("USER_BILLING_TABLE")

    username = event["userName"]
    user_email = event["userAttributes"]["email"]

    # Load the Stripe secret
    raw_secret = secrets_manager_client.get_secret_value(SecretId=secret_name)
    secret = json.loads(raw_secret)

    stripe.api_key = secret["STRIPE_KEY_SECRET"]

    # Create a new account for the user and store it
    res = stripe.Customer.create(
        email=user_email
    )

    customer_id = res["id"]

    dynamodb_client.put_item(
        TableName=user_billing_table,
        Item={
            "userId": username,
            "customerId": customer_id
        }
    )

    logger.info(f"Created and stored customer '{customer_id}' for user '{username}' with email '{user_email}'")
