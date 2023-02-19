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
    logger.info(f"Retrieving customer portal for '{event}'")

    secret_name = os.getenv("SECRET_NAME")
    user_billing_table = os.getenv("USER_BILLING_TABLE")
    stripe_product_id = os.getenv("STRIPE_PRODUCT_ID")
    stripe_price_ids = json.loads(os.getenv("STRIPE_PRICE_IDS"))

    username = event["requestContext"]["identity"]["user"]

    # Load the Stripe key
    secret_raw = secrets_manager_client.get_secret_value(SecretId=secret_name)
    secret = json.loads(secret_raw["SecretString"])

    stripe.api_key = secret["STRIPE_KEY_SECRET"]

    # Retrieve customer account
    response = dynamodb_client.get_item(
        TableName=user_billing_table,
        Item={"userId": username}
    )

    item = response["Item"]
    customer_id = item["customerId"]["S"]

    # Check if the customer already has a subscription
    customer = stripe.Customer.retrieve(customer_id, expand=["subscriptions"])
    subscriptions = customer["subscriptions"]["data"]

    active = False
    for subscription in subscriptions:
        if subscription["items"]["data"][0]["price"]["product"] == stripe_product_id:
            active = True

    # Route to a checkout
    if not active:
        session = stripe.checkout.Session.create(
            success_url="https://example.com/success",
            line_items=[{"price": price_id} for price_id in stripe_price_ids],
            mode="subscription"
        )

        logger.info(f"Created checkout session for user `{username}`")

        return {
            "statusCode": 302,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Location": session["url"]
            }
        }

    return {
        "statusCode": 200
    }

    # Route to a portal

    # logger.info(f"Created and stored customer '{customer_id}' for user '{username}' with email '{user_email}'")
