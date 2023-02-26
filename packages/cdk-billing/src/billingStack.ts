import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

interface IStackProps extends cdk.NestedStackProps {
    api: apigw.RestApi;
    authorizer: apigw.CognitoUserPoolsAuthorizer;
    userPool: cognito.UserPool;
    homeUrl: string;
}

export class BillingStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Create secret
        const stripeSecret = new secretsmanager.Secret(this, "stripeSecret");

        // Create the REST API
        const billingResource = props.api.root.addResource("billing");

        const portalResource = billingResource.addResource("portal");
        const iamResource = billingResource.addResource("iam");
        const statusResource = billingResource.addResource("status");

        const iamStatusResource = iamResource.addResource("status");
        const usageResource = iamResource.addResource("usage");

        // ==== Billing ====

        // Create billing setup function for new accounts
        const userBillingTable = new dynamodb.Table(this, "userBillingTable", {
            partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
        });

        const productsTable = new dynamodb.Table(this, "productsTable", {
            partitionKey: { name: "productId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
        });

        const usageTable = new dynamodb.Table(this, "usageTable", {
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
        });

        const setupFn = new lambda.Function(this, "setupFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "setup"), {
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
            timeout: cdk.Duration.seconds(30),
        });

        userBillingTable.grantWriteData(setupFn);
        stripeSecret.grantRead(setupFn);

        props.userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, setupFn);

        // Create account portal function
        const portalFn = new lambda.Function(this, "portalFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "portal"), {
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
                HOME_URL: props.homeUrl,
            },
            timeout: cdk.Duration.seconds(30),
        });

        stripeSecret.grantRead(portalFn);
        userBillingTable.grantReadData(portalFn);
        productsTable.grantReadData(portalFn);

        portalResource.addMethod("GET", new apigw.LambdaIntegration(portalFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Create IAM account status function
        const iamStatusFn = new lambda.Function(this, "iamStatusFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "iamStatus"), {
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
            },
            timeout: cdk.Duration.seconds(30),
        });

        stripeSecret.grantRead(iamStatusFn);
        userBillingTable.grantReadData(iamStatusFn);
        productsTable.grantReadData(iamStatusFn);

        iamStatusResource.addMethod("GET", new apigw.LambdaIntegration(iamStatusFn), {
            authorizationType: apigw.AuthorizationType.IAM,
        });

        // Create status function
        const statusFn = new lambda.Function(this, "statusFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "status"), {
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
            },
            timeout: cdk.Duration.seconds(30),
        });

        stripeSecret.grantRead(statusFn);
        userBillingTable.grantReadData(statusFn);
        productsTable.grantReadData(statusFn);

        statusResource.addMethod("GET", new apigw.LambdaIntegration(iamStatusFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Setup usage records
        const usageFnTimeout = cdk.Duration.minutes(5);

        const usageFn = new lambda.Function(this, "usageFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "usage"), {
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

        const usageQueue = new sqs.Queue(this, "usageQueue", {
            visibilityTimeout: usageFnTimeout,
        });

        usageFn.addEventSource(new lambdaEventSources.SqsEventSource(usageQueue));

        const credentialsRole = new iam.Role(this, "usageApiSqsRole", {
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
