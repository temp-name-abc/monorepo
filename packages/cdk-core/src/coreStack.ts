import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

interface IStackProps extends cdk.NestedStackProps {
    googleClientId: string;
    googleClientSecret: string;
    homeUrl: string;
}

export class CoreStack extends cdk.NestedStack {
    public readonly userPool: cognito.UserPool;
    public readonly apiAuth: apigw.CognitoUserPoolsAuthorizer;
    public readonly billingApi: apigw.RestApi;
    public readonly billingAuthorizer: apigw.CognitoUserPoolsAuthorizer;
    public readonly storageApi: apigw.RestApi;
    public readonly storageAuthorizer: apigw.CognitoUserPoolsAuthorizer;

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

        // Create API and authorizer
        this.billingApi = new apigw.RestApi(this, "billingApi", {
            restApiName: "billingApi",
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
            },
        });

        this.billingAuthorizer = new apigw.CognitoUserPoolsAuthorizer(this, "billingAuthorizer", {
            cognitoUserPools: [this.userPool],
        });

        this.storageApi = new apigw.RestApi(this, "storageApi", {
            restApiName: "storageApi",
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
            },
        });

        this.storageAuthorizer = new apigw.CognitoUserPoolsAuthorizer(this, "storageAuthorizer", {
            cognitoUserPools: [this.userPool],
        });
    }
}
