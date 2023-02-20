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
    logger.info(f"Retrieving user portal for '{event}'")

    secret_name = os.getenv("SECRET_NAME")
    user_billing_table = os.getenv("USER_BILLING_TABLE")
    products_table = os.getenv("PRODUCTS_TABLE")
    home_url = os.getenv("HOME_URL")

    username = event["requestContext"]["authorizer"]["claims"]["cognito:username"]

    # Load the Stripe key
    secret_raw = secrets_manager_client.get_secret_value(SecretId=secret_name)
    secret = json.loads(secret_raw["SecretString"])

    stripe.api_key = secret["STRIPE_KEY_SECRET"]

    # Retrieve customer account
    customer_response = dynamodb_client.get_item(
        TableName=user_billing_table,
        Key={"userId": {"S": username}}
    )

    item = customer_response["Item"]
    customer_id = item["customerId"]["S"]

    # Retrieve all products
    products_response = dynamodb_client.scan(TableName=products_table)
    items = products_response["Items"]

    while "LastEvaluatedKey" in products_response:
        products_response = dynamodb_client.scan(
            TableName=products_table,
            ExclusiveStartKey=products_response["LastEvaluatedKey"]
        )
        items.extend(products_response["Items"])

    stripe_product_id = items[0]["stripeProductId"]["S"]
    stripe_price_ids = [item["stripePriceId"]["S"] for item in items]

    # Check if the customer already has a subscription
    customer = stripe.Customer.retrieve(customer_id, expand=["subscriptions"])
    subscription_items = customer["subscriptions"]["data"]

    active = False
    for subscription_item in subscription_items:
        if subscription_item["items"]["data"][0]["price"]["product"] == stripe_product_id:
            active = True
            break

    # Route to a checkout
    if not active:
        session = stripe.checkout.Session.create(
            success_url=home_url,
            line_items=[{"price": price_id} for price_id in stripe_price_ids],
            mode="subscription",
            customer=customer_id
        )

        logger.info(f"Created checkout session for user `{username}`")

        return {
            "statusCode": 302,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Location": session["url"]
            }
        }

    # Route to a portal
    portal = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=home_url
    )

    logger.info(f"Created portal session for user `{username}`")

    return {
        "statusCode": 302,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Location": portal["url"]
        }
    }
