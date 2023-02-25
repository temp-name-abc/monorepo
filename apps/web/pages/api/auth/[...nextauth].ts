import NextAuth from "next-auth/next";
import CognitoProvider from "next-auth/providers/cognito";

export default NextAuth({
    providers: [
        CognitoProvider({
            clientId: process.env.COGNITO_CLIENT_ID as string,
            clientSecret: process.env.COGNITO_CLIENT_SECRET as string,
            issuer: process.env.COGNITO_ISSUER as string,
            checks: "nonce",
        }),
    ],
    callbacks: {
        async jwt(props) {
            if (props.account) props.token.idToken = props.account.id_token;

            return props.token;
        },
        async session(props) {
            // @ts-expect-error
            props.session.idToken = props.token.idToken;

            return props.session;
        },
    },
});
