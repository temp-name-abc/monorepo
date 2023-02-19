import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

interface IStackProps extends cdk.NestedStackProps {
    userPool: cognito.UserPool;
}

export class BillingStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Create Stripe secrets storage
        const stripeSecrets = new secretsmanager.Secret(this, "stripeSecrets");

        // Create billing setup function for new accounts
        const userBillingTable = new dynamodb.Table(this, "userBillingTable", {
            partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
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
        });

        userBillingTable.grantWriteData(setupFn);

        stripeSecrets.grantRead(setupFn);

        props.userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, setupFn);
    }
}
