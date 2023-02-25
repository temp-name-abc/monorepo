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
        async jwt({ account, token }) {
            if (account) token.idToken = account.id_token;

            return token;
        },
        async session({ session, token }) {
            // @ts-expect-error
            session.idToken = token.idToken;
            return session;
        },
    },
});
