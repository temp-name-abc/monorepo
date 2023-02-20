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
    logger.info(f"Setting up user account for event '{event}'")

    secret_name = os.getenv("SECRET_NAME")
    user_billing_table = os.getenv("USER_BILLING_TABLE")

    user_id = event["userName"]
    user_email = event["request"]["userAttributes"]["email"]

    # Load the Stripe key
    secret_raw = secrets_manager_client.get_secret_value(SecretId=secret_name)
    secret = json.loads(secret_raw["SecretString"])

    stripe.api_key = secret["STRIPE_KEY_SECRET"]

    # Create a new account for the user and store if it doesn't exist
    response = stripe.Customer.create(
        email=user_email
    )

    customer_id = response["id"]

    dynamodb_client.put_item(
        TableName=user_billing_table,
        Item={
            "userId": {"S": user_id},
            "stripeCustomerId": {"S": customer_id}
        },
        ConditionExpression="attribute_not_exists(userId)"
    )

    logger.info(f"Created and stored customer '{customer_id}' for user '{user_id}' with email '{user_email}'")

    return event