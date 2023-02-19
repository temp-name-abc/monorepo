import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";

interface IStackProps extends cdk.NestedStackProps {
    googleClientId: string;
    googleClientSecret: string;
}

export class CoreStack extends cdk.NestedStack {
    public readonly stripeSecrets: secretsmanager.Secret;
    public readonly userPool: cognito.UserPool;

    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Create secrets storage
        this.stripeSecrets = new secretsmanager.Secret(this, "stripeSecrets");

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
        });

        // Create authentication groups and register users on setup
        const standardGroupName = "standardGroup";

        new cognito.CfnUserPoolGroup(this, "standardGroup", {
            userPoolId: this.userPool.userPoolId,
            groupName: standardGroupName,
        });

        const fn = new lambda.Function(this, "signupGroupFunction", {
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
            handler: "index.lambda_handler",
            environment: {
                GROUP_NAME: standardGroupName,
            },
        });

        this.userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, fn);

        fn.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["cognito-idp:AdminAddUserToGroup"],
                resources: ["*"],
            })
        );
    }
}
