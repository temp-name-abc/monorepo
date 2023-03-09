import openai
import json
import os
import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
import urllib.parse
import requests


def make_request(url, method, data = None):
    session = boto3.session.Session()
    credentials = session.get_credentials()
    region = os.getenv("AWS_REGION")
    service = "execute-api"

    headers = {
        "Content-Type": "application/json"
    }

    http_request = AWSRequest(method=method, url=url, headers=headers, data=data)
    SigV4Auth(credentials, service, region).add_auth(http_request)

    return http_request


def set_openai_api_key(api_key):
    openai.api_key = api_key


def generate_chat(question, context, max_characters, user_id):
    messages = [
        {"role": "system", "content": f"You will play the role of a tutor and answer questions given the context only. If the information is not within the context, \
            you will say that there is not enough information for you to answer, and then explain what information you would require to answer the question. \
                Here is the context you will use to answer your questions:\n\nContext:\n{context}"},
    ]

    messages += [{"role": "user", "content": question}]

    return openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=max_characters // 4,
        user=user_id
    )["choices"][0]["message"]["content"].strip()


def is_safe_text(question):
    response = openai.Moderation.create(input=question)

    return not response["results"][0]["flagged"]


def get_documents(api_url, query, user_id, collection_id, max_documents, extend_down, min_threshold, extend_up):
    query_encoded = urllib.parse.quote(query)
    documents_url = f"{api_url}/storage/iam/search?userId={user_id}&collectionId={collection_id}&numResults={max_documents}&query={query_encoded}&extendDown={extend_down}&minThreshold={min_threshold}&extendUp={extend_up}"
    documents_request = make_request(documents_url, "GET")
    documents_req = requests.get(documents_url, headers=documents_request.headers)

    if not documents_req.ok:
        return None

    return documents_req.json()


def record_usage(api_url, user_id, timestamp, product_id, quantity):
    usage = [{"timestamp": elem[0], "productId": elem[1], "quantity": elem[2]} for elem in zip(timestamp, product_id, quantity)]

    usage_url = f"{api_url}/billing/iam/usage"
    usage_request = make_request(usage_url, "POST", json.dumps({
        "userId": user_id,
        "usage": usage
    }))
    usage_req = requests.post(
        usage_url,
        headers=usage_request.headers,
        data=usage_request.data
    )

    return usage_req.ok


def is_billable(api_url, user_id):
    active_url = f"{api_url}/billing/iam/status?userId={user_id}"
    active_request = make_request(active_url, "GET")
    active_req = requests.get(active_url, headers=active_request.headers)

    return not (not active_req.ok or not active_req.json()["active"])