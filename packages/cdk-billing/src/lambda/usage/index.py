import boto3
import json
import os
import logging
import stripe
import hashlib

logger = logging.getLogger()
logger.setLevel(logging.INFO)

secrets_manager_client = boto3.client("secretsmanager")
dynamodb_client = boto3.client("dynamodb")


def lambda_handler(event, context):
    logger.info(f"Reporting usage for '{event}'")

    secret_name = os.getenv("SECRET_NAME")
    user_billing_table = os.getenv("USER_BILLING_TABLE")
    products_table = os.getenv("PRODUCTS_TABLE")
    usage_table = os.getenv("USAGE_TABLE")

    # Load the Stripe key
    secret_raw = secrets_manager_client.get_secret_value(SecretId=secret_name)
    secret = json.loads(secret_raw["SecretString"])

    stripe.api_key = secret["STRIPE_KEY_SECRET"]

    # Process records
    for record in event["Records"]:
        body = json.loads(record["body"])

        # Extract data
        user_id = body["userId"]
        timestamp = body["timestamp"]
        product_id = body["productId"]

        key = hashlib.sha256(f"{user_id}:{timestamp}:{product_id}".encode()).hexdigest()

        # Retrieve user and product data
        user_data = dynamodb_client.get_item(TableName=user_billing_table, Key={"userId": {"S": user_id}})["Item"]
        product_data = dynamodb_client.get_item(TableName=products_table, Key={"productId": {"S": product_id}})["Item"]

        # Create record and report usage if not exists
        dynamodb_client.put_item(
            TableName=usage_table,
            Item={
                "id": {"S": key},
                "timestamp": {"S": timestamp},
                "productId": {"S": product_id},
                "metadata": {"S": json.dumps({"userData": user_data, "productData": product_data})}
            },
            ConditionExpression="attribute_not_exists(id)"
        )

        customer = stripe.Customer.retrieve(user_data["stripeCustomerId"]["S"], expand=["subscriptions"])
        subscriptions = customer["subscriptions"]["data"]

        for subscription in subscriptions:
            subscription_item = subscription["items"]["data"][0]

            if subscription_item["price"]["product"] == product_data["stripeProductId"]["S"]:
                stripe.SubscriptionItem.create_usage_record(
                    subscription_item["id"],
                    quantity=1,
                    timestamp=timestamp
                )

                logger.info(f"Reported usage for user '{user_id}' at time '{timestamp}' with product id '{product_id}'")

                return