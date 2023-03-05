import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { HOME_BASE_URL } from "utils";

interface IStackProps extends cdk.NestedStackProps {
    googleClientId: string;
    googleClientSecret: string;
    facebookClientId: string;
    facebookClientSecret: string;
}

export class CoreStack extends cdk.NestedStack {
    public readonly userPool: cognito.UserPool;
    public readonly api: apigw.RestApi;
    public readonly authorizer: apigw.CognitoUserPoolsAuthorizer;

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

        this.userPool.registerIdentityProvider(
            new cognito.UserPoolIdentityProviderFacebook(this, "facebookIdentityProvider", {
                userPool: this.userPool,
                clientId: props.facebookClientId,
                clientSecret: props.facebookClientSecret,
                scopes: ["email", "public_profile"],
                attributeMapping: {
                    email: cognito.ProviderAttribute.FACEBOOK_EMAIL,
                },
            })
        );

        this.userPool.addDomain("userPoolDomain", {
            cognitoDomain: {
                domainPrefix: "monorepo-app-domain",
            },
        });

        const callbackPath = "api/auth/callback/cognito";

        this.userPool.addClient("userPoolClient", {
            supportedIdentityProviders: [
                cognito.UserPoolClientIdentityProvider.COGNITO,
                cognito.UserPoolClientIdentityProvider.GOOGLE,
                cognito.UserPoolClientIdentityProvider.FACEBOOK,
            ],
            oAuth: {
                callbackUrls: [`${HOME_BASE_URL}/${callbackPath}`, `http://localhost:3000/${callbackPath}`],
            },
            generateSecret: true,
        });

        // Create API and authorizer
        this.api = new apigw.RestApi(this, "api", {
            restApiName: "api",
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
            },
        });

        this.authorizer = new apigw.CognitoUserPoolsAuthorizer(this, "authorizer", {
            cognitoUserPools: [this.userPool],
        });
    }
}
