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

        const collectionResource = props.api.root.addResource("collection");
        const collectionIdResource = props.api.root.addResource("{collectionId}");
        const documentResource = collectionIdResource.addResource("document");
        const documentIdResource = collectionIdResource.addResource("{documentId}");

        // ==== Collections ====
        const collectionsTable = new dynamodb.Table(this, "collectionsTable", {
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
                COLLECTIONS_TABLE: collectionsTable.tableName,
            },
            timeout: cdk.Duration.seconds(30),
        });

        collectionsTable.grantWriteData(createCollectionFn);

        collectionResource.addMethod("POST", new apigw.LambdaIntegration(createCollectionFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Retrieve collections function

        // Delete collection function

        // ==== Documents ====

        // Create upload function
        const uploadRecordsTable = new dynamodb.Table(this, "uploadRecordsTable", {
            partitionKey: { name: "uploadId", type: dynamodb.AttributeType.STRING },
            timeToLiveAttribute: "ttl",
        });

        const ttlExpiry = cdk.Duration.days(1);

        const tempStorageBucket = new s3.Bucket(this, "tempStorageBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
            lifecycleRules: [{ expiration: ttlExpiry, enabled: true }],
        });

        const uploadFn = new lambda.Function(this, "uploadFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "upload")),
            handler: "index.lambda_handler",
            environment: {
                UPLOAD_RECORDS_TABLE: uploadRecordsTable.tableName,
                TEMP_STORAGE_BUCKET: tempStorageBucket.bucketName,
                TTL_EXPIRY: ttlExpiry.toSeconds().toString(),
            },
            timeout: cdk.Duration.seconds(30),
        });

        uploadRecordsTable.grantWriteData(uploadFn);
        tempStorageBucket.grantWrite(uploadFn);

        documentResource.addMethod("POST", new apigw.LambdaIntegration(uploadFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Create object processing function
        const uploadLockTable = new dynamodb.Table(this, "uploadLockTable", {
            partitionKey: { name: "uploadId", type: dynamodb.AttributeType.STRING },
            timeToLiveAttribute: "ttl",
        });

        const documentTable = new dynamodb.Table(this, "documentTable", {
            partitionKey: { name: "documentId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
        });

        const documentBucket = new s3.Bucket(this, "documentBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
        });

        const processFn = new lambda.DockerImageFunction(this, "processFn", {
            code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, "lambda", "process")),
            environment: {
                PINECONE_SECRET: pineconeSecret.secretName,
                OPENAI_SECRET: openAISecret.secretName,
                UPLOAD_RECORDS_TABLE: uploadRecordsTable.tableName,
                UPLOAD_LOCK_TABLE: uploadLockTable.tableName,
                DOCUMENT_TABLE: documentTable.tableName,
                DOCUMENT_BUCKET: documentBucket.bucketName,
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
        tempStorageBucket.grantRead(processFn);
        uploadRecordsTable.grantReadData(processFn);
        uploadLockTable.grantWriteData(processFn);
        documentTable.grantWriteData(processFn);
        documentBucket.grantWrite(processFn);
        processFn.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["execute-api:Invoke"],
                resources: ["*"],
            })
        );

        processFn.addEventSource(
            new lambdaEventSources.S3EventSource(tempStorageBucket, {
                events: [s3.EventType.OBJECT_CREATED_POST],
            })
        );

        // Create search function
        const searchFn = new lambda.DockerImageFunction(this, "searchFn", {
            code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, "lambda", "search")),
            environment: {
                PINECONE_SECRET: pineconeSecret.secretName,
                OPENAI_SECRET: openAISecret.secretName,
                DOCUMENT_BUCKET: documentBucket.bucketName,
                PINECONE_ENV: props.pineconeEnv,
                PINECONE_INDEX: props.pineconeIndex,
            },
            timeout: cdk.Duration.minutes(1),
        });

        pineconeSecret.grantRead(searchFn);
        openAISecret.grantRead(searchFn);
        documentBucket.grantRead(searchFn);

        searchResource.addMethod("GET", new apigw.LambdaIntegration(searchFn), {
            authorizationType: apigw.AuthorizationType.IAM,
        });
    }
}
