import boto3
import json
import os
import logging
import stripe

logger = logging.getLogger()
logger.setLevel(logging.INFO)

secrets_manager_client = boto3.client("secretsmanager")
dynamodb_client = boto3.client("dynamodb")

def route_to_portal(customer_id: str, home_url: str, user_id: str):
    portal = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=home_url
    )

    logger.info(f"Created portal session for user `{user_id}`")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "url": portal["url"],
            "active": True
        })
    }


def lambda_handler(event, context):
    logger.info(f"Retrieving user portal for '{event}'")

    stripe_secret = os.getenv("STRIPE_SECRET")
    user_billing_table = os.getenv("USER_BILLING_TABLE")
    products_table = os.getenv("PRODUCTS_TABLE")
    home_url = os.getenv("HOME_URL")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
    
    query_params = event["multiValueQueryStringParameters"]

    product_ids = None
    if query_params != None and "productId" in query_params:
        product_ids = query_params["productId"]

    # Load the Stripe key
    stripe.api_key = secrets_manager_client.get_secret_value(SecretId=stripe_secret)["SecretString"]

    # Retrieve customer account
    customer_item = dynamodb_client.get_item(TableName=user_billing_table, Key={"userId": {"S": user_id}})["Item"]
    customer_id = customer_item["stripeCustomerId"]["S"]
    sandbox_mode = customer_item["sandbox"]["BOOL"] if "sandbox" in customer_item else False

    # Retrieve the product
    if product_ids == None:
        return route_to_portal(customer_id, home_url, user_id)

    # Check if the customer already has a subscription to the provided product ids
    customer = stripe.Customer.retrieve(customer_id, expand=["subscriptions"])
    subscription_items = customer["subscriptions"]["data"]

    subscribed_ids = set()
    price_mappings = {}

    for product_id in product_ids:
        product_item = dynamodb_client.get_item(TableName=products_table, Key={"productId": {"S": product_id}})["Item"]

        stripe_product_id = product_item["stripeProductId"]["S"]
        stripe_price_id = product_item["stripePriceId"]["S"]

        price_mappings[product_id] = stripe_price_id

        for subscription_item in subscription_items:
            if subscription_item["items"]["data"][0]["price"]["product"] == stripe_product_id:
                subscribed_ids.add(product_id)
                
                break


    if len(subscribed_ids) == len(product_ids):
        return route_to_portal(customer_id, home_url, user_id)

    # Route to checkout
    line_items = [{"price": price_mappings[product_id]} for product_id in product_ids if product_id not in subscribed_ids]

    session = stripe.checkout.Session.create(
        success_url=f"{home_url}?status=SUCCESS",
        cancel_url=f"{home_url}?status=FAILED",
        line_items=line_items,
        mode="subscription",
        customer=customer_id
    )

    logger.info(f"Created checkout session for user `{user_id}`")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "url": session["url"],
            "active": sandbox_mode
        })
    }

