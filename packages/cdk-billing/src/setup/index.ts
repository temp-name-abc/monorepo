import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export class Setup {
    constructor(
        stack: cdk.NestedStack,
        stripeSecret: secretsmanager.Secret,
        mailerliteSecret: secretsmanager.Secret,
        userBillingTable: dynamodb.Table,
        userPool: cognito.UserPool
    ) {
        const setupFn = new lambda.Function(stack, "setupFn", {
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
                MAILERLITE_SECRET: mailerliteSecret.secretName,
                USER_BILLING_TABLE: userBillingTable.tableName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        stripeSecret.grantRead(setupFn);
        mailerliteSecret.grantRead(setupFn);
        userBillingTable.grantWriteData(setupFn);

        userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, setupFn);
    }
}
