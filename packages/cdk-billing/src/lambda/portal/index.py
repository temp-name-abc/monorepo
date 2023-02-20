import boto3
import json
import os
import logging
import stripe

logger = logging.getLogger()
logger.setLevel(logging.INFO)

secrets_manager_client = boto3.client("secretsmanager")
dynamodb_client = boto3.client("dynamodb")


# Route to a portal
def route_to_portal(customer_id: str, home_url: str, username: str):
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


def lambda_handler(event, context):
    logger.info(f"Retrieving user portal for '{event}'")

    secret_name = os.getenv("SECRET_NAME")
    user_billing_table = os.getenv("USER_BILLING_TABLE")
    products_table = os.getenv("PRODUCTS_TABLE")
    home_url = os.getenv("HOME_URL")

    username = event["requestContext"]["authorizer"]["claims"]["cognito:username"]
    
    query_params = event["queryStringParameters"]

    product_id = None
    if "productId" in query_params:
        product_id = query_params["productId"]

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
    customer_id = item["stripeCustomerId"]["S"]

    if product_id == None:
        return route_to_portal(customer_id, home_url, username)

    # Retrieve the product
    product_response = dynamodb_client.get_item(
        TableName=products_table,
        Key={"productId": {"S": product_id}}
    )

    item = product_response["Item"]

    stripe_product_id = item["stripeProductId"]["S"]
    stripe_price_id = item["stripeProductId"]["S"]

    stripe_partner_id = None
    partner_share = None
    if "stripePartnerId" in item and "partnerShare" in item:
        stripe_partner_id = item["stripePartnerId"]["S"]
        partner_share = item["partnerShare"]["S"]

    # Check if the customer already has a subscription
    customer = stripe.Customer.retrieve(customer_id, expand=["subscriptions"])
    subscription_items = customer["subscriptions"]["data"]

    for subscription_item in subscription_items:
        if subscription_item["items"]["data"][0]["price"]["product"] == stripe_product_id:
            return route_to_portal(customer_id, home_url, username)

    # Route to checkout
    subscription_data = None if stripe_partner_id == None else {"transfer_data": {"destination": stripe_partner_id, "amount_percent": partner_share}}

    session = stripe.checkout.Session.create(
        success_url=home_url,
        line_items=[{"price": stripe_price_id}],
        mode="subscription",
        customer=customer_id,
        subscription_data=subscription_data
    )

    logger.info(f"Created checkout session for user `{username}`")

    return {
        "statusCode": 302,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Location": session["url"]
        }
    }

