import * as cdk from "aws-cdk-lib";
import { CoreStack } from "cdk-core";
import { Construct } from "constructs";
import { cdkEnv } from "types";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

const env = cdkEnv.parse({
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        new CoreStack(this, "coreStack", {
            googleClientId: env.googleClientId,
            googleClientSecret: env.googleClientSecret,
        });
    }
}
