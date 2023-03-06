import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Portal } from "./portal";
import { Setup } from "./setup";
import { Status } from "./status";
import { Usage } from "./usage";

interface IStackProps extends cdk.NestedStackProps {
    api: apigw.RestApi;
    authorizer: apigw.CognitoUserPoolsAuthorizer;
    userPool: cognito.UserPool;
}

export class BillingStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Create secret
        const stripeSecret = new secretsmanager.Secret(this, "stripeSecret");
        const mailerliteSecret = new secretsmanager.Secret(this, "mailerliteSecret");

        // Create the REST API
        const billingResource = props.api.root.addResource("billing");

        const portalResource = billingResource.addResource("portal");
        const iamResource = billingResource.addResource("iam");

        const statusResource = iamResource.addResource("status");
        const usageResource = iamResource.addResource("usage");

        // Create billing storage
        const userBillingTable = new dynamodb.Table(this, "userBillingTable", {
            partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        const productsTable = new dynamodb.Table(this, "productsTable", {
            partitionKey: { name: "productId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        const usageTable = new dynamodb.Table(this, "usageTable", {
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        // Create functions
        new Setup(this, stripeSecret, mailerliteSecret, userBillingTable, props.userPool);
        new Portal(this, props.authorizer, portalResource, stripeSecret, userBillingTable, productsTable);
        new Status(this, stripeSecret, userBillingTable, productsTable, statusResource);
        new Usage(this, stripeSecret, userBillingTable, productsTable, usageTable, usageResource);
    }
}
