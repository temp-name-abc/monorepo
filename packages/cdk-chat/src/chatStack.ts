import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { IProduct } from "types";
import { API_BASE_URL, chatData } from "utils";
import { Chat } from "./chat";
import { GetChats } from "./getChats";
import { CreateConversation } from "./createConversation";
import { UserConversations } from "./userConversations";

interface IStackProps extends cdk.NestedStackProps {
    api: apigw.RestApi;
    authorizer: apigw.CognitoUserPoolsAuthorizer;
}

export class ChatStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Store secret
        const openAISecret = new secretsmanager.Secret(this, "openAISecret");

        // Create the REST API
        const chatResource = props.api.root.addResource("chat");

        const conversationResource = chatResource.addResource("conversation");
        const conversationIdResource = conversationResource.addResource("{conversationId}");
        const convChatResource = conversationIdResource.addResource("chat");

        const timestampIndexName = "timestampIndex";

        // Select product for stack
        const product: IProduct = "chat.conversation.chat";

        // Create data storage
        const chatTable = new dynamodb.Table(this, "chatTable", {
            partitionKey: { name: "conversationId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "chatId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        chatTable.addLocalSecondaryIndex({
            indexName: timestampIndexName,
            sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
        });

        const conversationTable = new dynamodb.Table(this, "conversationTable", {
            partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "conversationId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        conversationTable.addLocalSecondaryIndex({
            indexName: timestampIndexName,
            sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
        });

        new CreateConversation(this, props.authorizer, conversationResource, conversationTable);
        new UserConversations(this, props.authorizer, conversationResource, conversationTable, timestampIndexName);
        new Chat(this, props.authorizer, convChatResource, openAISecret, conversationTable, chatTable, product);
        new GetChats(this, props.authorizer, convChatResource, conversationTable, chatTable, timestampIndexName);
    }
}
