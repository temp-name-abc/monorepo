import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";

interface IStackProps extends cdk.NestedStackProps {
    googleClientId: string;
    googleClientSecret: string;
    homeUrl: string;
}

export class CoreStack extends cdk.NestedStack {
    public readonly userPool: cognito.UserPool;

    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

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
                scopes: ["email"],
                attributeMapping: {
                    email: cognito.ProviderAttribute.GOOGLE_EMAIL,
                },
            })
        );

        this.userPool.addDomain("userPoolDomain", {
            cognitoDomain: {
                domainPrefix: "monorepo-app-domain",
            },
        });

        this.userPool.addClient("userPoolClient", {
            supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO, cognito.UserPoolClientIdentityProvider.GOOGLE],
            oAuth: {
                callbackUrls: [props.homeUrl],
            },
        });
    }
}
