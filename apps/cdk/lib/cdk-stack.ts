import * as cdk from "aws-cdk-lib";
import { CoreStack } from "cdk-core";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        new CoreStack(this, "coreStack", {});
    }
}
