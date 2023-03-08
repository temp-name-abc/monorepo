import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";
import { HOME_BASE_URL } from "utils";

export class Portal {
    constructor(
        stack: cdk.NestedStack,
        authorizer: apigw.CognitoUserPoolsAuthorizer,
        portalResource: apigw.Resource,
        stripeSecret: secretsmanager.Secret,
        userBillingTable: dynamodb.Table
    ) {
        // Create account portal function
        const portalFn = new lambda.Function(stack, "portalFn", {
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
                HOME_URL: HOME_BASE_URL,
            },
            timeout: cdk.Duration.minutes(1),
        });

        stripeSecret.grantRead(portalFn);
        userBillingTable.grantReadData(portalFn);

        portalResource.addMethod("GET", new apigw.LambdaIntegration(portalFn), {
            authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });
    }
}
