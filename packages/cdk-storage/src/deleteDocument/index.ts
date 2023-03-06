import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as path from "path";

export class DeleteDocument {
    constructor(
        stack: cdk.NestedStack,
        pineconeSecret: secretsmanager.Secret,
        authorizer: apigw.CognitoUserPoolsAuthorizer,
        chunkDocumentIndexName: string,
        documentIdResource: apigw.Resource,
        chunkTable: dynamodb.Table,
        documentTable: dynamodb.Table,
        documentBucket: s3.Bucket,
        processedDocumentBucket: s3.Bucket,
        chunkBucket: s3.Bucket
    ) {
        // Delete a document
        const deleteDocumentTimeout = cdk.Duration.minutes(15);

        const deleteDocumentFn = new lambda.Function(stack, "deleteDocumentFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda"), {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_8.bundlingImage,
                    command: ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output"],
                },
            }),
            handler: "index.lambda_handler",
            environment: {
                PINECONE_SECRET: pineconeSecret.secretName,
                DOCUMENT_TABLE: documentTable.tableName,
                DOCUMENT_BUCKET: documentBucket.bucketName,
                PROCESSED_DOCUMENT_BUCKET: processedDocumentBucket.bucketName,
                CHUNK_TABLE: chunkTable.tableName,
                CHUNK_DOCUMENT_INDEX_NAME: chunkDocumentIndexName,
                CHUNK_BUCKET: chunkBucket.bucketName,
            },
            timeout: deleteDocumentTimeout,
        });

        // Grant permissions
        pineconeSecret.grantRead(deleteDocumentFn);
        documentTable.grantReadWriteData(deleteDocumentFn);
        documentBucket.grantDelete(deleteDocumentFn);
        processedDocumentBucket.grantDelete(deleteDocumentFn);
        chunkTable.grantReadWriteData(deleteDocumentFn);
        chunkBucket.grantDelete(deleteDocumentFn);

        // Add API integration
        const deleteQueue = new sqs.Queue(stack, "deleteQueue", {
            visibilityTimeout: deleteDocumentTimeout,
        });

        deleteDocumentFn.addEventSource(new lambdaEventSources.SqsEventSource(deleteQueue));

        const credentialsRole = new iam.Role(stack, "deleteApiSqsRole", {
            assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
        });
        deleteQueue.grantSendMessages(credentialsRole);

        documentIdResource.addMethod(
            "DELETE",
            new apigw.AwsIntegration({
                service: "sqs",
                path: `${process.env.CDK_DEFAULT_ACCOUNT}/${deleteQueue.queueName}`,
                integrationHttpMethod: "POST",
                options: {
                    credentialsRole,
                    requestParameters: {
                        "integration.request.header.Content-Type": "'application/x-www-form-urlencoded'",
                    },
                    requestTemplates: {
                        "application/json": `Action=SendMessage&MessageBody={"pathParams": "$input.params().path", "userId": "$context.authorizer.claims.sub"}`,
                    },
                    integrationResponses: [
                        {
                            statusCode: "200",
                            responseParameters: {
                                "method.response.header.Access-Control-Allow-Origin": "'*'",
                            },
                        },
                    ],
                },
            }),
            {
                methodResponses: [
                    {
                        statusCode: "200",
                        responseParameters: {
                            "method.response.header.Access-Control-Allow-Origin": true,
                        },
                    },
                ],
                authorizer,
                authorizationType: apigw.AuthorizationType.COGNITO,
            }
        );
    }
}
