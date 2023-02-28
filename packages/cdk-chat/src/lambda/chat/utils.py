import openai
import json
import os
import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
import numpy as np
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


def generate_text(prompt, max_characters, temperature = 0.7):
    response = openai.Completion.create(prompt=prompt, temperature=temperature, max_tokens=max_characters // 4, model="text-davinci-003")
    output = response["choices"][0]["text"].strip()

    return output


def query_similarity(text, query):
    text_response = openai.Embedding.create(input=text, model="text-embedding-ada-002")
    text_embedding = np.array(text_response["data"][0]["embedding"])

    query_response = openai.Embedding.create(input=query, model="text-embedding-ada-002")
    query_embedding = np.array(query_response["data"][0]["embedding"])

    similarity = np.dot(text_embedding, query_embedding) / (np.linalg.norm(text_embedding) * np.linalg.norm(query_embedding))

    return similarity


def prompt_query(conversation, question):
    return f"""the following outputs the question that can be used to find the information required to answer the most recent question.

Current conversation:
{conversation}
Human: {question}

Query:"""


def prompt_chat(context, conversation, question):
    return f"""The following is a friendly conversation between a human and an AI.
The AI is talkative and provides lots of specific details from its context.
If the AI does not have enough context to answer the question, it says it does not have enough information to answer the question, and does not try to make up an answer.

Context:
{context}

Current conversation:
{conversation}
Human: {question}
AI:"""


def create_conversation(history):
    return "\n".join(f"""Human: {conversation["human"]}
AI: {conversation["ai"]}""" for conversation in history)


def create_context(context):
    return ". ".join(ctx["body"] for ctx in context)


def get_documents(api_url, query, user_id, collection_id, documents_retrieved):
    query_encoded = urllib.parse.quote(query)
    documents_url = f"{api_url}/storage/iam/search?userId={user_id}&collectionId={collection_id}&numResults={documents_retrieved}&query={query_encoded}"
    documents_request = make_request(documents_url, "GET")
    documents_req = requests.get(documents_url, headers=documents_request.headers)

    if not documents_req.ok:
        return None

    return documents_req.json()


def record_usage(api_url, user_id, timestamp, product_id, question):
    usage_url = f"{api_url}/billing/iam/usage"
    usage_request = make_request(usage_url, "POST", json.dumps({
        "userId": user_id,
        "timestamp": timestamp,
        "productId": product_id,
        "quantity": len(question)
    }))
    usage_req = requests.post(
        usage_url,
        headers=usage_request.headers,
        data=usage_request.data
    )

    return usage_req.ok


def is_billable(api_url, user_id, product_id):
    active_url = f"{api_url}/billing/iam/status?userId={user_id}&productId={product_id}"
    active_request = make_request(active_url, "GET")
    active_req = requests.get(active_url, headers=active_request.headers)

    return not (not active_req.ok or not active_req.json()["active"])