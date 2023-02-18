import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface IStackProps extends cdk.NestedStackProps {}

export class CoreStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props?: IStackProps) {
        super(scope, id, props);

        // Create secrets manager
    }
}
