FROM public.ecr.aws/lambda/python:3.8

COPY requirements.txt .
RUN pip3 install -r requirements.txt
RUN pip3 install openai[datalib]

COPY index.py .

CMD [ "index.lambda_handler" ]