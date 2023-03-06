import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";

export class CollectionDocuments {
    constructor(
        stack: cdk.NestedStack,
        authorizer: apigw.CognitoUserPoolsAuthorizer,
        documentResource: apigw.Resource,
        collectionTable: dynamodb.Table,
        documentTable: dynamodb.Table,
        documentBucket: s3.Bucket,
        processedDocumentBucket: s3.Bucket
    ) {
        // Retrieve collection documents
        const collectionDocumentsFn = new lambda.Function(stack, "collectionDocumentsFn", {
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

        collectionTable.grantReadData(collectionDocumentsFn);
        documentTable.grantReadData(collectionDocumentsFn);
        documentBucket.grantRead(collectionDocumentsFn);
        processedDocumentBucket.grantRead(collectionDocumentsFn);

        documentResource.addMethod("GET", new apigw.LambdaIntegration(collectionDocumentsFn), {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });
    }
}
