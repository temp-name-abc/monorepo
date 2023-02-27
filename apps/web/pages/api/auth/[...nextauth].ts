import NextAuth from "next-auth/next";
import CognitoProvider from "next-auth/providers/cognito";

async function refreshAccessToken(refreshToken: string) {
    const url =
        "https://" +
        process.env.COGNITO_DOMAIN +
        "/oauth2/token?" +
        new URLSearchParams({
            grant_type: "refresh_token",
            client_id: process.env.COGNITO_CLIENT_ID as string,
            client_secret: process.env.COGNITO_CLIENT_SECRET as string,
            refresh_token: refreshToken,
        });

    // Base 64 encode authentication string
    const headerString = process.env.COGNITO_CLIENT_ID + ":" + process.env.COGNITO_CLIENT_SECRET;
    const buff = Buffer.from(headerString, "utf-8");
    const authHeader = buff.toString("base64");

    const refreshedTokensResponse = await fetch(url, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + authHeader,
        },
        method: "POST",
    });

    const refreshedTokens = await refreshedTokensResponse.json();

    return refreshedTokens;
}

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
            if (props.account) {
                props.token.idToken = props.account.id_token;
                props.token.accessToken = props.account.access_token;
                props.token.refreshToken = props.account.refresh_token;
                props.token.expiresAt = (props.account.expires_at as number) * 1000;
            } else if (props.token.refreshToken && props.token.expiresAt) {
                const timestamp = Date.now();

                if (timestamp >= (props.token.expiresAt as number)) {
                    const refreshedTokens = await refreshAccessToken(props.token.refreshToken as string);

                    props.token.idToken = refreshedTokens.id_token;
                    props.token.accessToken = refreshedTokens.access_token;
                    props.token.expiresAt = timestamp + refreshedTokens.expires_in * 1000;
                }
            }

            return props.token;
        },
        async session(props) {
            // @ts-expect-error
            props.session.idToken = props.token.idToken;

            return props.session;
        },
    },
});
