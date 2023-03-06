import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";

export class GetDocument {
    constructor(
        stack: cdk.NestedStack,
        authorizer: apigw.CognitoUserPoolsAuthorizer,
        documentIdResource: apigw.Resource,
        collectionTable: dynamodb.Table,
        documentTable: dynamodb.Table,
        documentBucket: s3.Bucket,
        processedDocumentBucket: s3.Bucket
    ) {
        const getDocumentFn = new lambda.Function(stack, "getDocumentFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
            handler: "index.lambda_handler",
            environment: {
                COLLECTION_TABLE: collectionTable.tableName,
                DOCUMENT_TABLE: documentTable.tableName,
                DOCUMENT_BUCKET: documentBucket.bucketName,
                PROCESSED_DOCUMENT_BUCKET: processedDocumentBucket.bucketName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        collectionTable.grantReadData(getDocumentFn);
        documentTable.grantReadData(getDocumentFn);
        documentBucket.grantRead(getDocumentFn);
        processedDocumentBucket.grantRead(getDocumentFn);

        documentIdResource.addMethod("GET", new apigw.LambdaIntegration(getDocumentFn), {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });
    }
}
