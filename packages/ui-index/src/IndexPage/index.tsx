import { useTutorial } from "hooks";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Database, Messages } from "tabler-icons-react";
import { Card, CardLayout, SubAppShell } from "ui";

interface IProps {}

export function IndexPage({}: IProps) {
    const router = useRouter();
    const { completeTutorial } = useTutorial();

    useEffect(() => {
        if (!router.query.status) return;

        const status = router.query.status as "SUCCESS" | "FAILED";

        if (status === "SUCCESS") {
            // @ts-expect-error
            fbq("track", "Subscribe", { value: "0.00", currency: "USD", predicted_ltv: "10.00" });
            completeTutorial();
        }
        // @ts-expect-error
        else if (status === "FAILED") fbq("trackCustom", "FailedCheckout", {});
    }, [router]);

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
