import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export class UserConversations {
    constructor(
        stack: cdk.NestedStack,
        authorizer: apigw.CognitoUserPoolsAuthorizer,
        conversationResource: apigw.Resource,
        conversationTable: dynamodb.Table,
        timestampIndexName: string
    ) {
        // Get user conversations
        const userConversationsFn = new lambda.Function(stack, "userConversationsFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
            handler: "index.lambda_handler",
            environment: {
                CONVERSATION_TABLE: conversationTable.tableName,
                TIMESTAMP_INDEX_NAME: timestampIndexName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        conversationTable.grantReadData(userConversationsFn);

        conversationResource.addMethod("GET", new apigw.LambdaIntegration(userConversationsFn), {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });
    }
}
