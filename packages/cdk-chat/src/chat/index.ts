import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";
import { API_BASE_URL } from "utils";
import { IProduct } from "types";

export class Chat {
    constructor(
        stack: cdk.NestedStack,
        authorizer: apigw.CognitoUserPoolsAuthorizer,
        convChatResource: apigw.Resource,
        openAISecret: secretsmanager.Secret,
        conversationTable: dynamodb.Table,
        chatTable: dynamodb.Table
    ) {
        const chatPerCtxChunk: IProduct = "chat.per_ctx_chunk";
        const chatPerCharIn: IProduct = "chat.per_char_in";
        const chatPerCharOut: IProduct = "chat.per_char_out";

        const chatFn = new lambda.Function(stack, "chatFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda"), {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_8.bundlingImage,
                    command: ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output"],
                },
            }),
            handler: "index.lambda_handler",
            environment: {
                OPENAI_SECRET: openAISecret.secretName,
                CONVERSATION_TABLE: conversationTable.tableName,
                CHAT_TABLE: chatTable.tableName,
                API_URL: API_BASE_URL,
                PER_CTX_CHUNK_PRODUCT_ID: chatPerCtxChunk,
                PER_CHAR_IN_PRODUCT_ID: chatPerCharIn,
                PER_CHAR_OUT_PRODUCT_ID: chatPerCharOut,
            },
            timeout: cdk.Duration.minutes(1),
        });

        openAISecret.grantRead(chatFn);
        conversationTable.grantReadData(chatFn);
        chatTable.grantReadWriteData(chatFn);
        chatFn.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["execute-api:Invoke"],
                resources: ["*"],
            })
        );

        convChatResource.addMethod("POST", new apigw.LambdaIntegration(chatFn), {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });
    }
}
