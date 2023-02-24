import openai
import os
import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest


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


def generate_text(prompt, temperature = 0.7):
    response = openai.Completion.create(prompt=prompt, temperature=temperature, max_tokens=2048, model="text-davinci-003")
    output = response["choices"][0]["text"].strip()
    tokens = response["usage"]["total_tokens"]

    return output, tokens


def prompt_enough_info(context, question):
    return f"""The following answers whether the context provided in the following context is sufficient to answer the question.
If there is enough context provided to answer the question, the answer is 'yes', otherwise, the answer should be 'no'.

Context:
{context}

Question:
{question}

Answer:"""


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