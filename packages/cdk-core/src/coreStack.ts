import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cognito from "aws-cdk-lib/aws-cognito";

interface IStackProps extends cdk.NestedStackProps {
    googleClientId: string;
    googleClientSecret: string;
}

export class CoreStack extends cdk.NestedStack {
    public readonly secrets: secretsmanager.Secret;
    public readonly userPool: cognito.UserPool;

    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Create secrets storage
        this.secrets = new secretsmanager.Secret(this, "secrets");

        // Create authentication setup
        this.userPool = new cognito.UserPool(this, "userPool", {
            selfSignUpEnabled: true,
            autoVerify: { email: true },
            signInAliases: { email: true },
        });

        this.userPool.registerIdentityProvider(
            new cognito.UserPoolIdentityProviderGoogle(this, "googleIdentityProvider", {
                userPool: this.userPool,
                clientId: props.googleClientId,
                clientSecret: props.googleClientSecret,
            })
        );

        this.userPool.addDomain("userPoolDomain", {
            cognitoDomain: {
                domainPrefix: "monorepo-app-domain",
            },
        });

        this.userPool.addClient("userPoolClient", {
            supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO, cognito.UserPoolClientIdentityProvider.GOOGLE],
        });

        // Create authentication groups and register users on setup
        const standardGroup = new cognito.CfnUserPoolGroup(this, "standardGroup", {
            userPoolId: this.userPool.userPoolProviderName,
        });

        // this.userPool.addTrigger()
    }
}
