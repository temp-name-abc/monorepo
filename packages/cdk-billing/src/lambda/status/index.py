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
    logger.info(f"Retrieving account status for '{event}'")

    secret_name = os.getenv("SECRET_NAME")
    user_billing_table = os.getenv("USER_BILLING_TABLE")
    products_table = os.getenv("PRODUCTS_TABLE")

    username = event["requestContext"]["identity"]["user"] # **** Would be good to verify this with a real API endpoint

    # Load the Stripe key
    secret_raw = secrets_manager_client.get_secret_value(SecretId=secret_name)
    secret = json.loads(secret_raw["SecretString"])

    stripe.api_key = secret["STRIPE_KEY_SECRET"]

    # Retrieve customer account
    response = dynamodb_client.get_item(
        TableName=user_billing_table,
        Key={"userId": {"S": username}}
    )

    item = response["Item"]
    customer_id = item["customerId"]["S"]

    # Retrieve the product id
    response = dynamodb_client.scan(TableName=products_table, Limit=1)
    items = response["Items"]

    stripe_product_id = items[0]["stripeProductId"]["S"]

    # Check if the customer already has a subscription
    customer = stripe.Customer.retrieve(customer_id, expand=["subscriptions"])
    subscription_items = customer["subscriptions"]["data"]

    active = False
    for subscription_item in subscription_items:
        if subscription_item["items"]["data"][0]["price"]["product"] == stripe_product_id:
            active = True
            break

    logger.info(f"Retrieved status active = '{active}' for user '{username}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "active": active
        })
    }
