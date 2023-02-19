import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cognito = boto3.client("cognito-idp")

def lambda_handler(event, context):
    group_name = os.getenv("GROUP_NAME")

    user_pool_id = event["userPoolId"]
    username = event["userName"]

    # Add user to the group
    cognito.admin_add_user_to_group(
        UserPoolId=user_pool_id,
        GroupName=group_name,
        Username=username
    )

    logger.info(f"Added user '{username}' to group '{group_name}' in user pool with id '{user_pool_id}'")