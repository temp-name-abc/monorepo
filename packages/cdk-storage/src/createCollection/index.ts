import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export class CreateCollection {
    constructor(stack: cdk.NestedStack, authorizer: apigw.CognitoUserPoolsAuthorizer, collectionResource: apigw.Resource, collectionTable: dynamodb.Table) {
        // Create collection function
        const createCollectionFn = new lambda.Function(stack, "createCollectionFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
            handler: "index.lambda_handler",
            environment: {
                COLLECTION_TABLE: collectionTable.tableName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        collectionTable.grantWriteData(createCollectionFn);

        collectionResource.addMethod("POST", new apigw.LambdaIntegration(createCollectionFn), {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });
    }
}
