import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export class GetChats {
    constructor(
        stack: cdk.NestedStack,
        authorizer: apigw.CognitoUserPoolsAuthorizer,
        convChatResource: apigw.Resource,
        conversationTable: dynamodb.Table,
        chatTable: dynamodb.Table,
        timestampIndexName: string
    ) {
        const getChatsFn = new lambda.Function(stack, "getChatsFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
            handler: "index.lambda_handler",
            environment: {
                CONVERSATION_TABLE: conversationTable.tableName,
                CHAT_TABLE: chatTable.tableName,
                TIMESTAMP_INDEX_NAME: timestampIndexName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        conversationTable.grantReadData(getChatsFn);
        chatTable.grantReadData(getChatsFn);

        convChatResource.addMethod("GET", new apigw.LambdaIntegration(getChatsFn), {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });
    }
}
