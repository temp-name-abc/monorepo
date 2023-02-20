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

    stripe_secret = os.getenv("STRIPE_SECRET")
    user_billing_table = os.getenv("USER_BILLING_TABLE")
    products_table = os.getenv("PRODUCTS_TABLE")

    query_params = event["queryStringParameters"]

    user_id = query_params["userId"]
    product_id = query_params["productId"]

    # Load the Stripe key
    stripe.api_key = secrets_manager_client.get_secret_value(SecretId=stripe_secret)["SecretString"]

    # Retrieve customer account
    user_data = dynamodb_client.get_item(
        TableName=user_billing_table,
        Key={"userId": {"S": user_id}}
    )["Item"]

    customer_id = user_data["stripeCustomerId"]["S"]

    # Retrieve the product id
    product_data = dynamodb_client.get_item(
        TableName=products_table,
        Key={"productId": {"S": product_id}}
    )["Item"]

    stripe_product_id = product_data["stripeProductId"]["S"]

    # Check if the customer already has a subscription
    customer = stripe.Customer.retrieve(customer_id, expand=["subscriptions"])
    subscriptions = customer["subscriptions"]["data"]

    active = False
    for subscription in subscriptions:
        if subscription["items"]["data"][0]["price"]["product"] == stripe_product_id:
            active = True
            break

    logger.info(f"Retrieved status active '{active}' for user '{user_id}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "active": active
        })
    }
