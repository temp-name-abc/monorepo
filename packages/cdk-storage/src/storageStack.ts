import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as path from "path";

interface IStackProps extends cdk.NestedStackProps {
    api: apigw.RestApi;
    authorizer: apigw.CognitoUserPoolsAuthorizer;
    apiUrl: string;
    pineconeEnv: string;
    pineconeIndex: string;
    productId: string;
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
        });

        // Create collection function
        const createCollectionFn = new lambda.Function(this, "createCollectionFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "createCollection")),
            handler: "index.lambda_handler",
            environment: {
                COLLECTION_TABLE: collectionTable.tableName,
            },
            timeout: cdk.Duration.seconds(30),
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
            timeout: cdk.Duration.seconds(30),
        });

        collectionTable.grantReadData(userCollectionsFn);

        collectionResource.addMethod("GET", new apigw.LambdaIntegration(userCollectionsFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // ==== Documents ====
        const documentTable = new dynamodb.Table(this, "documentTable", {
            partitionKey: { name: "collectionId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "documentId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
        });

        const uploadRecordsTable = new dynamodb.Table(this, "uploadRecordsTable", {
            partitionKey: { name: "uploadId", type: dynamodb.AttributeType.STRING },
            timeToLiveAttribute: "ttl",
        });

        const uploadLockTable = new dynamodb.Table(this, "uploadLockTable", {
            partitionKey: { name: "uploadId", type: dynamodb.AttributeType.STRING },
            timeToLiveAttribute: "ttl",
        });

        const documentBucket = new s3.Bucket(this, "documentBucket", {
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
            },
            timeout: cdk.Duration.seconds(30),
        });

        collectionTable.grantReadData(collectionDocumentsFn);
        documentTable.grantReadData(collectionDocumentsFn);

        documentResource.addMethod("GET", new apigw.LambdaIntegration(collectionDocumentsFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Retrieve document
        const getDocumentFn = new lambda.Function(this, "getDocumentFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "getDocument")),
            handler: "index.lambda_handler",
            environment: {
                DOCUMENT_TABLE: documentTable.tableName,
                DOCUMENT_BUCKET: documentBucket.bucketName,
            },
            timeout: cdk.Duration.seconds(30),
        });

        documentTable.grantReadData(getDocumentFn);
        documentBucket.grantRead(getDocumentFn);

        documentIdResource.addMethod("GET", new apigw.LambdaIntegration(getDocumentFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Create upload function
        const uploadFn = new lambda.Function(this, "uploadFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "upload")),
            handler: "index.lambda_handler",
            environment: {
                UPLOAD_RECORDS_TABLE: uploadRecordsTable.tableName,
                COLLECTION_TABLE: collectionTable.tableName,
                DOCUMENT_BUCKET: documentBucket.bucketName,
            },
            timeout: cdk.Duration.seconds(30),
        });

        uploadRecordsTable.grantWriteData(uploadFn);
        collectionTable.grantReadData(uploadFn);
        documentBucket.grantWrite(uploadFn);

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
                UPLOAD_LOCK_TABLE: uploadLockTable.tableName,
                DOCUMENT_TABLE: documentTable.tableName,
                CHUNK_TABLE: chunkTable.tableName,
                CHUNK_BUCKET: chunkBucket.bucketName,
                API_URL: props.apiUrl,
                PINECONE_ENV: props.pineconeEnv,
                PINECONE_INDEX: props.pineconeIndex,
                PRODUCT_ID: props.productId,
                CHUNK_SIZE: "150",
            },
            timeout: cdk.Duration.minutes(15),
        });

        pineconeSecret.grantRead(processFn);
        openAISecret.grantRead(processFn);
        uploadRecordsTable.grantReadData(processFn);
        uploadLockTable.grantWriteData(processFn);
        documentTable.grantWriteData(processFn);
        documentBucket.grantRead(processFn);
        chunkTable.grantWriteData(processFn);
        chunkBucket.grantWrite(processFn);
        processFn.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["execute-api:Invoke"],
                resources: ["*"],
            })
        );

        processFn.addEventSource(
            new lambdaEventSources.S3EventSource(documentBucket, {
                events: [s3.EventType.OBJECT_CREATED_POST],
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
                PINECONE_ENV: props.pineconeEnv,
                PINECONE_INDEX: props.pineconeIndex,
            },
            timeout: cdk.Duration.minutes(1),
        });

        pineconeSecret.grantRead(searchFn);
        openAISecret.grantRead(searchFn);
        collectionTable.grantReadData(searchFn);
        chunkBucket.grantRead(searchFn);

        searchResource.addMethod("GET", new apigw.LambdaIntegration(searchFn), {
            authorizationType: apigw.AuthorizationType.IAM,
        });
    }
}
