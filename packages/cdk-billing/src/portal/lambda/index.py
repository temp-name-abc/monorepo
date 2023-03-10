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

    stripe_secret = os.getenv("STRIPE_SECRET")
    user_billing_table = os.getenv("USER_BILLING_TABLE")
    home_url = os.getenv("HOME_URL")

    user_id = event["requestContext"]["authorizer"]["claims"]["sub"]

    # Load the Stripe data
    stripe_data = json.loads(secrets_manager_client.get_secret_value(SecretId=stripe_secret)["SecretString"])
    stripe.api_key = stripe_data["apiKey"]

    stripe_product_id = stripe_data["productId"]
    stripe_price_id = stripe_data["priceId"]

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
                "url": home_url,
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

    if active:
        portal = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=home_url
        )

        logger.info(f"Created portal session for user `{user_id}` with active '{active}' and status '{status}'")

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "url": portal["url"],
                "active": active,
                "status": status
            })
        }

    # Route to checkout
    subscription_data = {
        "subscription_data": {
            "trial_settings": {"end_behavior": {"missing_payment_method": "cancel"}},
            "trial_period_days": 30,
        },
        "payment_method_collection": "if_required"
    } if status == "NOT_SUBSCRIBED" else {}


    session = stripe.checkout.Session.create(
        success_url=f"{home_url}?status=CHECKOUT_SUCCESS",
        cancel_url=f"{home_url}?status=CHECKOUT_FAILED",
        line_items=[{"price": stripe_price_id}],
        mode="subscription",
        customer=customer_id,
        **subscription_data
    )

    logger.info(f"Created checkout session for user `{user_id}` with active '{active}' and status '{status}'")

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "url": session["url"],
            "active": active,
            "status": status
        })
    }

