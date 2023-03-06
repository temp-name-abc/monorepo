import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";

export class Search {
    constructor(
        stack: cdk.NestedStack,
        pineconeSecret: secretsmanager.Secret,
        openAISecret: secretsmanager.Secret,
        searchResource: apigw.Resource,
        collectionTable: dynamodb.Table,
        chunkTable: dynamodb.Table,
        chunkBucket: s3.Bucket,
        chunkDocumentIndexName: string
    ) {
        // Create search function
        const searchFn = new lambda.DockerImageFunction(stack, "searchFn", {
            code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, "lambda")),
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
