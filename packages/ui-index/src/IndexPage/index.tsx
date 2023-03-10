import { useQuery } from "@tanstack/react-query";
import { getPortal } from "helpers";
import { useTutorial } from "hooks";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Database, Messages } from "tabler-icons-react";
import { Card, CardLayout, SubAppShell } from "ui";
import { KEY_PORTAL } from "utils";

interface IProps {}

export function IndexPage({}: IProps) {
    const session = useSession();
    const router = useRouter();
    const { completeTutorial } = useTutorial();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data: portalData } = useQuery([KEY_PORTAL], () => getPortal(token as string), {
        enabled: !!token,
    });

    useEffect(() => {
        if (!router.query.status) return;

        const status = router.query.status as "CHECKOUT_SUCCESS" | "CHECKOUT_FAILED" | "LOGGED_IN";

        if (status === "CHECKOUT_SUCCESS") {
            // @ts-expect-error
            fbq("track", "Subscribe", { value: "0.00", currency: "USD", predicted_ltv: "10.00" });
            completeTutorial();
        }
        // @ts-expect-error
        else if (status === "CHECKOUT_FAILED") fbq("trackCustom", "FailedCheckout", {});
        else if (status === "LOGGED_IN" && portalData && !portalData.active) router.push(portalData.url);
    }, [router, completeTutorial, portalData]);

    return (
        <SubAppShell
            title="MonoStack / Home"
            description="Welcome to MonoStack, the number one platform powering natural language conversations with your data."
            links={[]}
        >
            <CardLayout
                elements={[
                    <Card
                        title="Storage"
                        description="Create a collection. Upload your documents. Use the collection as a knowledgebase for chatting."
                        icon={<Database />}
                        url="/storage/collections"
                    />,
                    <Card
                        title="Chat"
                        description="Select a collection. Ask a question. Receive the respone. Verify the sources used."
                        icon={<Messages />}
                        url="/chat/conversations"
                    />,
                ]}
            />
        </SubAppShell>
    );
}

export default IndexPage;
