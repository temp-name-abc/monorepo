import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as path from "path";

export class Usage {
    constructor(
        stack: cdk.NestedStack,
        stripeSecret: secretsmanager.Secret,
        userBillingTable: dynamodb.Table,
        productsTable: dynamodb.Table,
        usageTable: dynamodb.Table,
        usageResource: apigw.Resource
    ) {
        // Setup usage records
        const usageFnTimeout = cdk.Duration.minutes(5);

        const usageFn = new lambda.Function(stack, "usageFn", {
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
                PRODUCTS_TABLE: productsTable.tableName,
                USAGE_TABLE: usageTable.tableName,
            },
            timeout: usageFnTimeout,
        });

        stripeSecret.grantRead(usageFn);
        userBillingTable.grantReadData(usageFn);
        productsTable.grantReadData(usageFn);
        usageTable.grantWriteData(usageFn);

        const usageQueue = new sqs.Queue(stack, "usageQueue", {
            visibilityTimeout: usageFnTimeout,
        });

        usageFn.addEventSource(new lambdaEventSources.SqsEventSource(usageQueue));

        const credentialsRole = new iam.Role(stack, "usageApiSqsRole", {
            assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
        });
        usageQueue.grantSendMessages(credentialsRole);

        usageResource.addMethod(
            "POST",
            new apigw.AwsIntegration({
                service: "sqs",
                path: `${process.env.CDK_DEFAULT_ACCOUNT}/${usageQueue.queueName}`,
                integrationHttpMethod: "POST",
                options: {
                    credentialsRole,
                    requestParameters: {
                        "integration.request.header.Content-Type": "'application/x-www-form-urlencoded'",
                    },
                    requestTemplates: {
                        "application/json": "Action=SendMessage&MessageBody=$input.body",
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
                authorizationType: apigw.AuthorizationType.IAM,
            }
        );
    }
}
