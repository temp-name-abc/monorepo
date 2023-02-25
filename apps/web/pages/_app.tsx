import { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AppShell } from "ui";
import "../styles.css";

const queryClient = new QueryClient();

export function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <SessionProvider session={session}>
                <AppShell>
                    <Component {...pageProps} />
                </AppShell>
            </SessionProvider>
        </QueryClientProvider>
    );
}

export default MyApp;
