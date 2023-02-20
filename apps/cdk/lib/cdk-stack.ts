import * as cdk from "aws-cdk-lib";
import { CoreStack } from "cdk-core";
import { Construct } from "constructs";
import { BillingStack } from "cdk-billing";
import { StorageStack } from "cdk-storage";
import { cdkEnv } from "types";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

const env = cdkEnv.parse({
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    homeUrl: process.env.HOME_URL,
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
            apiAuth: coreStack.apiAuth,
            userPool: coreStack.userPool,
            homeUrl: env.homeUrl,
        });

        new StorageStack(this, "storageStack", {
            api: coreStack.api,
            apiAuth: coreStack.apiAuth,
            pineconeSecrets: coreStack.pineconeSecrets,
            openAISecrets: coreStack.openAISecrets,
        });
    }
}
