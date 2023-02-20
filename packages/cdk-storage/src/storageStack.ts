import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

interface IStackProps extends cdk.NestedStackProps {
    api: apigw.RestApi;
    apiAuth: apigw.CognitoUserPoolsAuthorizer;
    pineconeSecrets: secretsmanager.Secret;
    openAISecrets: secretsmanager.Secret;
}

export class StorageStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);
    }
}
