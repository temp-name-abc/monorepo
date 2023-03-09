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

    query_params = event["queryStringParameters"]

    user_id = query_params["userId"]

    # Load the Stripe data
    stripe_data = json.loads(secrets_manager_client.get_secret_value(SecretId=stripe_secret)["SecretString"])
    stripe.api_key = stripe_data["apiKey"]

    stripe_product_id = stripe_data["productId"]

    # Retrieve customer account
    customer_item = dynamodb_client.get_item(TableName=user_billing_table, Key={"userId": {"S": user_id}})["Item"]
    customer_id = customer_item["stripeCustomerId"]["S"]
    sandbox_mode = customer_item["sandbox"]["BOOL"] if "sandbox" in customer_item else False

    if sandbox_mode:
        logger.info(f"User is in sandbox mode")

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "active": sandbox_mode,
                "status": "SANDBOX"
            })
        }

    # Get account active and status states
    active = False
    status = None

    subscriptions = stripe.Subscription.list(customer=customer_id, status="all").data

    active_subscriptions = []
    other_subscriptions = []

    for subscription in subscriptions:
        if subscription["items"]["data"][0]["price"]["product"] == stripe_product_id:
            if subscription["status"] in ["active", "trialing"]:
                active_subscriptions.append(subscription)
            else:
                other_subscriptions.append(subscription)

    if active_subscriptions:
        # Customer has an active subscription to the given product ID
        subscription = active_subscriptions[0]
        has_card = bool(subscription["default_payment_method"])
        is_trialing = subscription["status"] == "trialing"

        if is_trialing:
            if has_card:
                # Customer is on a trial and has added a card
                active = True
                status = "TRIALING_CARD"
            else:
                # Customer is on a trial but has not added a card
                active = True
                status = "TRIALING_NO_CARD"
        else:
            # Customer has an active subscription
            active = True
            status = "CARD"

    else:
        if other_subscriptions:
            # Customer has subscribed to the given product ID before but has since cancelled
            active = False
            status = "NOT_SUBSCRIBED_TRIAL_ENDED"
        else:
            # Customer has never subscribed to the given product ID
            active = False
            status = "NOT_SUBSCRIBED"

    logger.info(f"Got billing status for user `{user_id}` with active '{active}' and status '{status}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "active": active,
            "status": status
        })
    }

