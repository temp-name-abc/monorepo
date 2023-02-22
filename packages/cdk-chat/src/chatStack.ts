import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

interface IStackProps extends cdk.NestedStackProps {
    api: apigw.RestApi;
    authorizer: apigw.CognitoUserPoolsAuthorizer;
    apiUrl: string;
    productId: string;
}

export class ChatStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Store secret
        const openAISecret = new secretsmanager.Secret(this, "chatOpenAISecret");

        // Create the REST API
        const chatResource = props.api.root.addResource("chat");

        // Create upload function
        const conversationsTable = new dynamodb.Table(this, "conversationsTable", {
            partitionKey: { name: "chatId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
        });

        const chatFn = new lambda.Function(this, "chatFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "chat"), {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_8.bundlingImage,
                    command: ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output"],
                },
            }),
            handler: "index.lambda_handler",
            environment: {
                OPENAI_SECRET: openAISecret.secretName,
                CONVERSATIONS_TABLE: conversationsTable.tableName,
                API_URL: props.apiUrl,
                PRODUCT_ID: props.productId,
            },
            timeout: cdk.Duration.minutes(1),
        });

        openAISecret.grantRead(chatFn);
        conversationsTable.grantReadWriteData(chatFn);
        chatFn.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["execute-api:Invoke"],
                resources: ["*"],
            })
        );

        chatResource.addMethod("POST", new apigw.LambdaIntegration(chatFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });
    }
}
