import { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";

import "../styles.css";
import { AppShell } from "ui";

export function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
    return (
        <SessionProvider session={session}>
            <AppShell>
                <Component {...pageProps} />
            </AppShell>
        </SessionProvider>
    );
}

export default MyApp;
