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
        const openAISecret = new secretsmanager.Secret(this, "openAISecret");

        // Create the REST API
        const chatResource = props.api.root.addResource("chat");

        const answerResource = chatResource.addResource("answer");

        const conversationResource = chatResource.addResource("conversation");
        const conversationIdResource = conversationResource.addResource("{conversationId}");
        const convChatResource = conversationIdResource.addResource("chat");

        // ==== Conversation ====
        const conversationTable = new dynamodb.Table(this, "conversationTable", {
            partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "conversationId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
        });

        // Create conversation
        const createConversationFn = new lambda.Function(this, "createConversationFn", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "createConversation")),
            handler: "index.lambda_handler",
            environment: {
                CONVERSATION_TABLE: conversationTable.tableName,
            },
            timeout: cdk.Duration.minutes(1),
        });

        conversationTable.grantWriteData(createConversationFn);

        conversationResource.addMethod("POST", new apigw.LambdaIntegration(createConversationFn), {
            authorizer: props.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO,
        });

        // ==== Chat ====
        // const conversationTable = new dynamodb.Table(this, "conversationTable", {
        //     partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
        //     sortKey: { name: "conversationId", type: dynamodb.AttributeType.STRING },
        //     pointInTimeRecovery: true,
        // });

        // const chatTable = new dynamodb.Table(this, "chatTable", {
        //     partitionKey: { name: "conversationId", type: dynamodb.AttributeType.STRING },
        //     sortKey: { name: "chatId", type: dynamodb.AttributeType.STRING },
        //     pointInTimeRecovery: true,
        // });

        // // Create answer function
        // const answerFn = new lambda.Function(this, "answerFn", {
        //     runtime: lambda.Runtime.PYTHON_3_8,
        //     code: lambda.Code.fromAsset(path.join(__dirname, "lambda", "answer"), {
        //         bundling: {
        //             image: lambda.Runtime.PYTHON_3_8.bundlingImage,
        //             command: ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output"],
        //         },
        //     }),
        //     handler: "index.lambda_handler",
        //     environment: {
        //         OPENAI_SECRET: openAISecret.secretName,
        //         CONVERSATION_TABLE: conversationTable.tableName,
        //         CHAT_TABLE: chatTable.tableName,
        //         API_URL: props.apiUrl,
        //         PRODUCT_ID: props.productId,
        //         MEMORY_SIZE: "5",
        //     },
        //     timeout: cdk.Duration.minutes(1),
        // });

        // openAISecret.grantRead(answerFn);
        // conversationTable.grantWriteData(answerFn);
        // chatTable.grantReadWriteData(answerFn);
        // answerFn.addToRolePolicy(
        //     new iam.PolicyStatement({
        //         effect: iam.Effect.ALLOW,
        //         actions: ["execute-api:Invoke"],
        //         resources: ["*"],
        //     })
        // );

        // answerResource.addMethod("GET", new apigw.LambdaIntegration(answerFn), {
        //     authorizer: props.authorizer,
        //     authorizationType: apigw.AuthorizationType.COGNITO,
        // });
    }
}
