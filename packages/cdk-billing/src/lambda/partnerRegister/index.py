import boto3
import json
import os
import logging
import stripe

logger = logging.getLogger()
logger.setLevel(logging.INFO)

secrets_manager_client = boto3.client("secretsmanager")
dynamodb_client = boto3.client("dynamodb")
client = boto3.client("cognito-idp")


def lambda_handler(event, context):
    logger.info(f"Register new partner for '{event}'")

    secret_name = os.getenv("SECRET_NAME")
    user_pool_id = os.getenv("USER_POOL_ID")
    partner_table = os.getenv("PARTNER_TABLE")
    admin_group_name = os.getenv("ADMIN_GROUP_NAME")

    username = event["requestContext"]["identity"]["user"] # **** Would be good to verify this with a real API endpoint

    # Only admin users can register
    response = client.admin_list_groups_for_user(
        UserPoolId=user_pool_id,
        Username=username
    )

    groups = [group['GroupName'] for group in response['Groups']]

    if admin_group_name not in groups:
        return {
            "statusCode": 403,
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "body": f"Only users with the role '{admin_group_name}' may create a new partner"
        }

    # Load the Stripe key
    secret_raw = secrets_manager_client.get_secret_value(SecretId=secret_name)
    secret = json.loads(secret_raw["SecretString"])

    stripe.api_key = secret["STRIPE_KEY_SECRET"]

    # Create a new partner account if it doesn't exist