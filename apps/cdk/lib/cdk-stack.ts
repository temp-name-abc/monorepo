import * as cdk from "aws-cdk-lib";
import { CoreStack } from "cdk-core";
import { Construct } from "constructs";
import { BillingStack } from "cdk-billing";
import { StorageStack } from "cdk-storage";
import dotenv from "dotenv";
import { ChatStack } from "../../../packages/cdk-chat";

dotenv.config({ path: "./.env.local" });

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const coreStack = new CoreStack(this, "coreStack", {
            googleClientId: process.env.GOOGLE_CLIENT_ID as string,
            googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            facebookClientId: process.env.FACEBOOK_CLIENT_ID as string,
            facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
        });

        new BillingStack(this, "billingStack", {
            api: coreStack.api,
            authorizer: coreStack.authorizer,
            userPool: coreStack.userPool,
        });

        new StorageStack(this, "storageStack", {
            api: coreStack.api,
            authorizer: coreStack.authorizer,
        });

        new ChatStack(this, "chatStack", {
            api: coreStack.api,
            authorizer: coreStack.authorizer,
        });
    }
}
