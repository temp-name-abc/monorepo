import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";
import { API_BASE_URL } from "utils";
import { IProduct } from "types";

export class Upload {
    constructor(
        stack: cdk.NestedStack,
        authorizer: apigw.CognitoUserPoolsAuthorizer,
        documentResource: apigw.Resource,
        collectionTable: dynamodb.Table,
        uploadRecordsTable: dynamodb.Table,
        tempBucket: s3.Bucket,
        product: IProduct
    ) {
        const uploadFn = new lambda.Function(stack, "uploadFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda"), {
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
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });
    }
}
