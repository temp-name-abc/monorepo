import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export class CreateConversation {
    constructor(stack: cdk.NestedStack, authorizer: apigw.CognitoUserPoolsAuthorizer, conversationResource: apigw.Resource, conversationTable: dynamodb.Table) {
        const createConversationFn = new lambda.Function(stack, "createConversationFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
            handler: "index.lambda_handler",
            environment: {
                CONVERSATION_TABLE: conversationTable.tableName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        conversationTable.grantWriteData(createConversationFn);

        conversationResource.addMethod("POST", new apigw.LambdaIntegration(createConversationFn), {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });
    }
}
