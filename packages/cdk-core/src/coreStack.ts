import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

interface IStackProps extends cdk.NestedStackProps {}

export class CoreStack extends cdk.NestedStack {
    secrets: secretsmanager.Secret;

    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Create secrets storage
        this.secrets = new secretsmanager.Secret(this, "secrets");
    }
}
