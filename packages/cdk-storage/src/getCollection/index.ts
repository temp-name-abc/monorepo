import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export class GetCollection {
    constructor(stack: cdk.NestedStack, authorizer: apigw.CognitoUserPoolsAuthorizer, collectionIdResource: apigw.Resource, collectionTable: dynamodb.Table) {
        // Get the collection
        const getCollectionFn = new lambda.Function(stack, "getCollectionFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
            handler: "index.lambda_handler",
            environment: {
                COLLECTION_TABLE: collectionTable.tableName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        collectionTable.grantReadData(getCollectionFn);

        collectionIdResource.addMethod("GET", new apigw.LambdaIntegration(getCollectionFn), {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });
    }
}
