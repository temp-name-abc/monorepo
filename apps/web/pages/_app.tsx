import { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider, TutorialProvider } from "providers";
import { AppShell } from "ui";
import "../styles.css";
import Script from "next/script";
import Image from "next/image";

const queryClient = new QueryClient();

export function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    const fbId = process.env.NEXT_PUBLIC_FB_ID;

    return (
        <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${gaId}');
        `}
            </Script>
            <Script id="facebook-pixel" strategy="afterInteractive">
                {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbId}');
            fbq('track', 'PageView');
        `}
            </Script>
            <noscript>
                <Image alt="Facebook pixel" height="1" width="1" style={{ display: "none" }} src={`https://www.facebook.com/tr?id=${fbId}&ev=PageView&noscript=1`} />
            </noscript>
            <QueryClientProvider client={queryClient}>
                <SessionProvider session={session}>
                    <TutorialProvider>
                        <NotificationProvider>
                            <AppShell>
                                <Component {...pageProps} />
                            </AppShell>
                        </NotificationProvider>
                    </TutorialProvider>
                </SessionProvider>
            </QueryClientProvider>
        </>
    );
}

export default MyApp;
