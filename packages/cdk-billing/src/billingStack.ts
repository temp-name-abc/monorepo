import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

interface IStackProps extends cdk.NestedStackProps {
    api: apigw.RestApi;
    apiAuth: apigw.CognitoUserPoolsAuthorizer;
    userPool: cognito.UserPool;
    homeUrl: string;
}

export class BillingStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Create Stripe secrets storage
        const stripeSecrets = new secretsmanager.Secret(this, "stripeSecrets");

        // Create API resources
        const billingResource = props.api.root.addResource("billing");

        const portalResource = billingResource.addResource("portal");
        const statusResource = billingResource.addResource("status");
        const usageResource = billingResource.addResource("usage");

        // Create billing setup function for new accounts
        const userBillingTable = new dynamodb.Table(this, "userBillingTable", {
            partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
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
                SECRET_NAME: stripeSecrets.secretName,
                USER_BILLING_TABLE: userBillingTable.tableName,
            },
            timeout: cdk.Duration.seconds(30),
        });

        userBillingTable.grantWriteData(setupFn);
        stripeSecrets.grantRead(setupFn);

        props.userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, setupFn);

        // Create account portal function
        const productsTable = new dynamodb.Table(this, "productsTable", {
            partitionKey: { name: "productId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
        });

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
                SECRET_NAME: stripeSecrets.secretName,
                USER_BILLING_TABLE: userBillingTable.tableName,
                PRODUCTS_TABLE: productsTable.tableName,
                HOME_URL: props.homeUrl,
            },
            timeout: cdk.Duration.seconds(30),
        });

        stripeSecrets.grantRead(portalFn);
        userBillingTable.grantReadData(portalFn);
        productsTable.grantReadData(portalFn);

        portalResource.addMethod("GET", new apigw.LambdaIntegration(portalFn), {
            authorizer: props.apiAuth,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Create account status function
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
                SECRET_NAME: stripeSecrets.secretName,
                USER_BILLING_TABLE: userBillingTable.tableName,
                PRODUCTS_TABLE: productsTable.tableName,
            },
            timeout: cdk.Duration.seconds(30),
        });

        stripeSecrets.grantRead(statusFn);
        userBillingTable.grantReadData(statusFn);
        productsTable.grantReadData(statusFn);

        statusResource.addMethod("GET", new apigw.LambdaIntegration(statusFn), {
            authorizationType: apigw.AuthorizationType.IAM,
        });

        // Setup payment processing
        const usageTable = new dynamodb.Table(this, "usageTable", {
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
        });

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
                SECRET_NAME: stripeSecrets.secretName,
                USER_BILLING_TABLE: userBillingTable.tableName,
                PRODUCTS_TABLE: productsTable.tableName,
                USAGE_TABLE: usageTable.tableName,
            },
            timeout: usageFnTimeout,
        });

        stripeSecrets.grantRead(usageFn);
        userBillingTable.grantReadData(usageFn);
        productsTable.grantReadData(usageFn);
        usageTable.grantWriteData(usageFn);

        const usageQueue = new sqs.Queue(this, "usageQueue", {
            visibilityTimeout: usageFnTimeout,
        });

        usageFn.addEventSource(new SqsEventSource(usageQueue));
    }
}
