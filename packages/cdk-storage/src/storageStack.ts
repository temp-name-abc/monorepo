import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as path from "path";
import { IProduct } from "types";
import { API_BASE_URL, chatData } from "utils";

interface IStackProps extends cdk.NestedStackProps {
    api: apigw.RestApi;
    authorizer: apigw.CognitoUserPoolsAuthorizer;
}

export class StorageStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Store secret
        const pineconeSecret = new secretsmanager.Secret(this, "pineconeSecret");
        const openAISecret = new secretsmanager.Secret(this, "openAISecret");

        // Create the REST API
        const storageResource = props.api.root.addResource("storage");

        const iamResource = storageResource.addResource("iam");
        const searchResource = iamResource.addResource("search");

        const collectionResource = storageResource.addResource("collection");
        const collectionIdResource = collectionResource.addResource("{collectionId}");
        const documentResource = collectionIdResource.addResource("document");
        const documentIdResource = documentResource.addResource("{documentId}");

        // ==== Collections ====
        const collectionTable = new dynamodb.Table(this, "collectionTable", {
            partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "collectionId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        // Create collection function
        const createCollectionFn = new lambda.Function(this, "createCollectionFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "createCollection")),
            handler: "index.lambda_handler",
            environment: {
                COLLECTION_TABLE: collectionTable.tableName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        collectionTable.grantWriteData(createCollectionFn);

        collectionResource.addMethod("POST", new apigw.LambdaIntegration(createCollectionFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Retrieve collections function
        const userCollectionsFn = new lambda.Function(this, "userCollectionsFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "userCollections")),
            handler: "index.lambda_handler",
            environment: {
                COLLECTION_TABLE: collectionTable.tableName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        collectionTable.grantReadData(userCollectionsFn);

        collectionResource.addMethod("GET", new apigw.LambdaIntegration(userCollectionsFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Get the collection
        const getCollectionFn = new lambda.Function(this, "getCollectionFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "getCollection")),
            handler: "index.lambda_handler",
            environment: {
                COLLECTION_TABLE: collectionTable.tableName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        collectionTable.grantReadData(getCollectionFn);

        collectionIdResource.addMethod("GET", new apigw.LambdaIntegration(getCollectionFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // ==== Documents ====
        const documentTable = new dynamodb.Table(this, "documentTable", {
            partitionKey: { name: "collectionId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "documentId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        const uploadRecordsTable = new dynamodb.Table(this, "uploadRecordsTable", {
            partitionKey: { name: "uploadId", type: dynamodb.AttributeType.STRING },
            timeToLiveAttribute: "ttl",
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        const tempBucket = new s3.Bucket(this, "tempBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
            lifecycleRules: [
                {
                    expiration: cdk.Duration.days(1),
                },
            ],
        });

        const documentBucket = new s3.Bucket(this, "documentBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
        });

        const processedDocumentBucket = new s3.Bucket(this, "processedDocumentBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
        });

        const chunkTable = new dynamodb.Table(this, "chunkTable", {
            partitionKey: { name: "chunkId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        const chunkDocumentIndexName = "chunkDocumentIndex";

        chunkTable.addGlobalSecondaryIndex({
            indexName: chunkDocumentIndexName,
            partitionKey: { name: "documentId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "chunkNum", type: dynamodb.AttributeType.NUMBER },
        });

        const chunkBucket = new s3.Bucket(this, "chunkBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
        });

        // Retrieve collection documents
        const collectionDocumentsFn = new lambda.Function(this, "collectionDocumentsFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "collectionDocuments")),
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
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Get a document
        const getDocumentFn = new lambda.Function(this, "getDocumentFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "getDocument")),
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
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Delete a document
        const deleteDocumentTimeout = cdk.Duration.minutes(15);

        const deleteDocumentFn = new lambda.Function(this, "deleteDocumentFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "deleteDocument"), {
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
        const deleteQueue = new sqs.Queue(this, "deleteQueue", {
            visibilityTimeout: deleteDocumentTimeout,
        });

        deleteDocumentFn.addEventSource(new lambdaEventSources.SqsEventSource(deleteQueue));

        const credentialsRole = new iam.Role(this, "deleteApiSqsRole", {
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
                authorizer: props.authorizer,
                authorizationType: apigw.AuthorizationType.COGNITO,
            }
        );

        // Create upload function
        const product: IProduct = "storage.collection.document.process";

        const uploadFn = new lambda.Function(this, "uploadFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "upload"), {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_8.bundlingImage,
                    command: ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output"],
                },
            }),
            handler: "index.lambda_handler",
            environment: {
                UPLOAD_RECORDS_TABLE: uploadRecordsTable.tableName,
                COLLECTION_TABLE: collectionTable.tableName,
                TEMP_BUCKET: tempBucket.bucketName,
                PRODUCT_ID: product,
                API_URL: API_BASE_URL,
                MAX_FILE_SIZE: (5e9).toString(),
            },
            timeout: cdk.Duration.minutes(1),
        });

        uploadRecordsTable.grantWriteData(uploadFn);
        collectionTable.grantReadData(uploadFn);
        tempBucket.grantWrite(uploadFn);
        uploadFn.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["execute-api:Invoke"],
                resources: ["*"],
            })
        );

        documentResource.addMethod("POST", new apigw.LambdaIntegration(uploadFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Create object processing function
        const processFn = new lambda.DockerImageFunction(this, "processFn", {
            code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, "lambda", "process")),
            environment: {
                PINECONE_SECRET: pineconeSecret.secretName,
                OPENAI_SECRET: openAISecret.secretName,
                UPLOAD_RECORDS_TABLE: uploadRecordsTable.tableName,
                DOCUMENT_TABLE: documentTable.tableName,
                DOCUMENT_BUCKET: documentBucket.bucketName,
                PROCESSED_DOCUMENT_BUCKET: processedDocumentBucket.bucketName,
                CHUNK_TABLE: chunkTable.tableName,
                CHUNK_BUCKET: chunkBucket.bucketName,
                API_URL: API_BASE_URL,
                PRODUCT_ID: product,
                CHUNK_CHARACTERS: chatData.chunkCharacters.toString(),
            },
            timeout: cdk.Duration.minutes(15),
        });

        pineconeSecret.grantRead(processFn);
        openAISecret.grantRead(processFn);
        uploadRecordsTable.grantReadData(processFn);
        tempBucket.grantRead(processFn);
        documentTable.grantReadWriteData(processFn);
        documentBucket.grantWrite(processFn);
        processedDocumentBucket.grantWrite(processFn);
        chunkTable.grantReadWriteData(processFn);
        chunkBucket.grantWrite(processFn);
        processFn.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["execute-api:Invoke"],
                resources: ["*"],
            })
        );

        processFn.addEventSource(
            new lambdaEventSources.S3EventSource(tempBucket, {
                events: [s3.EventType.OBJECT_CREATED_PUT],
            })
        );

        // ==== Search ====

        // Create search function
        const searchFn = new lambda.DockerImageFunction(this, "searchFn", {
            code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, "lambda", "search")),
            environment: {
                PINECONE_SECRET: pineconeSecret.secretName,
                OPENAI_SECRET: openAISecret.secretName,
                COLLECTION_TABLE: collectionTable.tableName,
                CHUNK_BUCKET: chunkBucket.bucketName,
                CHUNK_TABLE: chunkTable.tableName,
                CHUNK_DOCUMENT_INDEX_NAME: chunkDocumentIndexName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        pineconeSecret.grantRead(searchFn);
        openAISecret.grantRead(searchFn);
        collectionTable.grantReadData(searchFn);
        chunkBucket.grantRead(searchFn);
        chunkTable.grantReadData(searchFn);

        searchResource.addMethod("GET", new apigw.LambdaIntegration(searchFn), {
            authorizationType: apigw.AuthorizationType.IAM,
        });
    }
}
