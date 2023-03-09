import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as path from "path";
import { API_BASE_URL, chatData } from "utils";
import { IProduct } from "types";

export class Process {
    constructor(
        stack: cdk.NestedStack,
        pineconeSecret: secretsmanager.Secret,
        openAISecret: secretsmanager.Secret,
        documentTable: dynamodb.Table,
        documentBucket: s3.Bucket,
        processedDocumentBucket: s3.Bucket,
        chunkTable: dynamodb.Table,
        chunkBucket: s3.Bucket,
        uploadRecordsTable: dynamodb.Table,
        tempBucket: s3.Bucket
    ) {
        const storagePerChar: IProduct = "storage.per_char";

        // Create object processing function
        const processFn = new lambda.DockerImageFunction(stack, "processFn", {
            code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, "lambda")),
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
                STORAGE_PER_CHAR_PRODUCT_ID: storagePerChar,
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
    }
}
