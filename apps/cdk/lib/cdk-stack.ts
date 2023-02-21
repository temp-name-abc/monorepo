import * as cdk from "aws-cdk-lib";
import { CoreStack } from "cdk-core";
import { Construct } from "constructs";
import { BillingStack } from "cdk-billing";
import { StorageStack } from "cdk-storage";
import { cdkEnv } from "types";
import dotenv from "dotenv";
import { ChatStack } from "../../../packages/cdk-chat";

dotenv.config({ path: "./.env.local" });

const env = cdkEnv.parse({
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    homeUrl: process.env.HOME_URL,
    apiUrl: process.env.API_URL,
    pineconeEnv: process.env.PINECONE_ENV,
    pineconeIndex: process.env.PINECONE_INDEX,
    productIdDocumentProcessText: process.env.PRODUCT_ID_DOCUMENT_PROCESS_TEXT,
    productIdChat: process.env.PRODUCT_ID_CHAT,
});

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const coreStack = new CoreStack(this, "coreStack", {
            googleClientId: env.googleClientId,
            googleClientSecret: env.googleClientSecret,
            homeUrl: env.homeUrl,
        });

        new BillingStack(this, "billingStack", {
            api: coreStack.api,
            authorizer: coreStack.authorizer,
            userPool: coreStack.userPool,
            homeUrl: env.homeUrl,
        });

        new StorageStack(this, "storageStack", {
            api: coreStack.api,
            authorizer: coreStack.authorizer,
            apiUrl: env.apiUrl,
            pineconeEnv: env.pineconeEnv,
            pineconeIndex: env.pineconeIndex,
            productId: env.productIdDocumentProcessText,
        });

        new ChatStack(this, "chatStack", {
            api: coreStack.api,
            authorizer: coreStack.authorizer,
            apiUrl: env.apiUrl,
            productId: env.productIdChat,
        });
    }
}
