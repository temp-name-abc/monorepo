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
    
    query_params = event["queryStringParameters"]

    product_id = None
    if query_params != None and "productId" in query_params:
        product_id = query_params["productId"]

    # Load the Stripe key
    stripe.api_key = secrets_manager_client.get_secret_value(SecretId=stripe_secret)["SecretString"]

    # Retrieve customer account
    customer_item = dynamodb_client.get_item(TableName=user_billing_table, Key={"userId": {"S": user_id}})["Item"]
    customer_id = customer_item["stripeCustomerId"]["S"]

    # Retrieve the product
    if product_id == None:
        return route_to_portal(customer_id, home_url, user_id)

    product_item = dynamodb_client.get_item(TableName=products_table, Key={"productId": {"S": product_id}})["Item"]

    stripe_product_id = product_item["stripeProductId"]["S"]
    stripe_price_id = product_item["stripePriceId"]["S"]

    # Add the partner share amount
    stripe_partner_id = None
    partner_share = None
    if "stripePartnerId" in product_item and "partnerShare" in product_item:
        stripe_partner_id = product_item["stripePartnerId"]["S"]
        partner_share = product_item["partnerShare"]["S"]

    # Check if the customer already has a subscription
    customer = stripe.Customer.retrieve(customer_id, expand=["subscriptions"])
    subscription_items = customer["subscriptions"]["data"]

    for subscription_item in subscription_items:
        if subscription_item["items"]["data"][0]["price"]["product"] == stripe_product_id:
            return route_to_portal(customer_id, home_url, user_id)

    # Route to checkout
    subscription_data = None if stripe_partner_id == None else {"transfer_data": {"destination": stripe_partner_id, "amount_percent": partner_share}}

    session = stripe.checkout.Session.create(
        success_url=home_url,
        line_items=[{"price": stripe_price_id}],
        mode="subscription",
        customer=customer_id,
        subscription_data=subscription_data
    )

    logger.info(f"Created checkout session for user `{user_id}`")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "url": session["url"],
            "active": False
        })
    }

