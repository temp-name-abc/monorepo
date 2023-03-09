import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export class Status {
    constructor(stack: cdk.NestedStack, stripeSecret: secretsmanager.Secret, userBillingTable: dynamodb.Table, statusResource: apigw.Resource) {
        const statusFn = new lambda.Function(stack, "statusFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda"), {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_8.bundlingImage,
                    command: ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output"],
                },
            }),
            handler: "index.lambda_handler",
            environment: {
                STRIPE_SECRET: stripeSecret.secretName,
                USER_BILLING_TABLE: userBillingTable.tableName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        stripeSecret.grantRead(statusFn);
        userBillingTable.grantReadData(statusFn);

        statusResource.addMethod("GET", new apigw.LambdaIntegration(statusFn), {
            authorizationType: apigw.AuthorizationType.IAM,
        });
    }
}
