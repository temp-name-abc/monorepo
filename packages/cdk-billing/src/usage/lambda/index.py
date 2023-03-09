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

    stripe_secret = os.getenv("STRIPE_SECRET")
    user_billing_table = os.getenv("USER_BILLING_TABLE")
    products_table = os.getenv("PRODUCTS_TABLE")
    usage_table = os.getenv("USAGE_TABLE")

    # Load the Stripe key
    stripe_data = json.loads(secrets_manager_client.get_secret_value(SecretId=stripe_secret)["SecretString"])
    stripe.api_key = stripe_data["apiKey"]

    stripe_product_id = stripe_data["productId"]

    # Process records
    for record in event["Records"]:
        body = json.loads(record["body"])

        user_id = body["userId"]
        usage_records = body["usage"]

        # Get customer data
        user_data = dynamodb_client.get_item(TableName=user_billing_table, Key={"userId": {"S": user_id}})["Item"]

        customer = stripe.Customer.retrieve(user_data["stripeCustomerId"]["S"], expand=["subscriptions"])
        subscriptions = customer["subscriptions"]["data"]


        if "sandbox" in user_data and user_data["sandbox"]["BOOL"]:
            logger.info(f"User is in sandbox mode - skipping")

            continue

        # Process records
        for i, usage_record in enumerate(usage_records):
            key = hashlib.sha256(f"{body}:{i}:{json.dumps(usage_record)}".encode()).hexdigest()

            product_data = dynamodb_client.get_item(TableName=products_table, Key={"productId": {"S": usage_record["productId"]}})["Item"]

            # Create record and report usage if not exists
            try:
                dynamodb_client.put_item(
                    TableName=usage_table,
                    Item={
                        "id": {"S": key},
                        "timestamp": {"N": str(usage_record["timestamp"])},
                        "productId": {"S": usage_record["productId"]},
                        "userId": {"S": user_id},
                        "quantity": {"N": str(usage_record["quantity"])}
                    },
                    ConditionExpression="attribute_not_exists(id)"
                )
            except dynamodb_client.exceptions.ConditionalCheckFailedException:
                logger.warning(f"Already reported usage for key '{key}'")

                continue

            # Report usage to Stripe
            for subscription in subscriptions:
                if subscription["status"] != "active" or int(usage_record["quantity"]) <= 0:
                    logger.info(f"Cannot report with status '{subscription['status']}' and quantity '{usage_record['quantity']}' - skipping")

                    continue

                subscription_item = subscription["items"]["data"][0]

                if subscription_item["price"]["product"] == stripe_product_id:
                    stripe.SubscriptionItem.create_usage_record(
                        subscription_item["id"],
                        quantity=int(usage_record["quantity"]) * int(product_data["credits"]["N"]),
                        timestamp=usage_record["timestamp"]
                    )

                    logger.info(f"Reported usage for user '{user_id}' at time '{usage_record['timestamp']}' with product id '{usage_record['productId']}'")

                    break