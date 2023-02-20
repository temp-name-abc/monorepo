import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigw from "aws-cdk-lib/aws-apigateway";

interface IStackProps extends cdk.NestedStackProps {
    api: apigw.RestApi;
    apiAuth: apigw.CognitoUserPoolsAuthorizer;
    userPool: cognito.UserPool;
    homeUrl: string;
    adminGroupName: string;
}

export class BillingStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Create Stripe secrets storage
        const stripeSecrets = new secretsmanager.Secret(this, "stripeSecrets");

        // Create API resources
        const billingResource = props.api.root.addResource("billing");

        const accountResource = billingResource.addResource("account");

        const portalResource = accountResource.addResource("portal");
        const statusResource = accountResource.addResource("status");
        const usageResource = accountResource.addResource("usage");

        const partnerResource = billingResource.addResource("partner");

        const dashboardResource = partnerResource.addResource("dashboard");
        const registerResource = partnerResource.addResource("register");

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
            sortKey: { name: "priceId", type: dynamodb.AttributeType.STRING },
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

        // Store partner account details
        const partnerTable = new dynamodb.Table(this, "partnerTable", {
            partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
        });

        const partnerRegisterFn = new lambda.Function(this, "partnerRegisterFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "partnerRegister"), {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_8.bundlingImage,
                    command: ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output"],
                },
            }),
            handler: "index.lambda_handler",
            environment: {
                SECRET_NAME: stripeSecrets.secretName,
                PARTNER_TABLE: partnerTable.tableName,
                ADMIN_GROUP_NAME: props.adminGroupName,
            },
            timeout: cdk.Duration.seconds(30),
        });

        partnerRegisterFn.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["cognito-idp:AdminListGroupsForUser", "cognito-idp:AdminGetUser"],
                resources: ["*"],
            })
        );
        stripeSecrets.grantRead(partnerRegisterFn);
        partnerTable.grantWriteData(partnerRegisterFn);

        registerResource.addMethod("POST", new apigw.LambdaIntegration(partnerRegisterFn), {
            authorizer: props.apiAuth,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Get partner dashboard
        const partnerDashboardFn = new lambda.Function(this, "partnerDashboardFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "partnerDashboard"), {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_8.bundlingImage,
                    command: ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output"],
                },
            }),
            handler: "index.lambda_handler",
            environment: {
                SECRET_NAME: stripeSecrets.secretName,
                PARTNER_TABLE: partnerTable.tableName,
            },
            timeout: cdk.Duration.seconds(30),
        });

        stripeSecrets.grantRead(partnerDashboardFn);
        partnerTable.grantReadData(partnerDashboardFn);

        dashboardResource.addMethod("GET", new apigw.LambdaIntegration(partnerDashboardFn), {
            authorizer: props.apiAuth,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // Submit usage events
        // **** Submit the userId, timestamp, productId
        // **** Authenticate using IAM
        // **** Check if we need to delegate prices between others based on the commission value (e.g. partner, percentage)
        // **** Also need to add idempotency and SQS API gateway integration
    }
}
