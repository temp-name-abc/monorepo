import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as path from "path";

interface IStackProps extends cdk.NestedStackProps {
    api: apigw.RestApi;
    apiAuth: apigw.CognitoUserPoolsAuthorizer;
    pineconeSecrets: secretsmanager.Secret;
    openAISecrets: secretsmanager.Secret;
}

export class StorageStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Create resources
        const storageResource = props.api.root.addResource("storage");

        const documentResource = storageResource.addResource("document");
        const iamResource = storageResource.addResource("iam");

        const searchResource = iamResource.addResource("search");

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
            authorizer: props.apiAuth,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Create object processing function
        const documentTable = new dynamodb.Table(this, "documentTable", {
            partitionKey: { name: "documentId", type: dynamodb.AttributeType.STRING },
        });

        const documentBucket = new s3.Bucket(this, "documentBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
        });

        const processFn = new lambda.Function(this, "processFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "process"), {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_8.bundlingImage,
                    command: ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output"],
                },
            }),
            handler: "index.lambda_handler",
            environment: {
                PINECONE_SECRET: props.pineconeSecrets.secretName,
                OPENAI_SECRET: props.openAISecrets.secretName,
                UPLOAD_RECORDS_TABLE: uploadRecordsTable.tableName,
                DOCUMENT_TABLE: documentTable.tableName,
                DOCUMENT_BUCKET: documentBucket.bucketName,
                API_DOMAIN: props.api.url,
            },
            timeout: cdk.Duration.minutes(15),
        });

        props.pineconeSecrets.grantRead(processFn);
        props.openAISecrets.grantRead(processFn);
        tempStorageBucket.grantRead(processFn);
        uploadRecordsTable.grantReadData(processFn);
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
                events: [s3.EventType.OBJECT_CREATED_PUT],
            })
        );
    }
}
