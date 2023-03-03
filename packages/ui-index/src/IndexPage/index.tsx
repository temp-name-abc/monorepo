import { useRouter } from "next/router";
import { Database, Messages } from "tabler-icons-react";
import { Card, CardLayout, SubAppShell } from "ui";

interface IProps {}

export function IndexPage({}: IProps) {
    const router = useRouter();

    if (router.query.status) {
        const status = router.query.status as "SUCCESS" | "FAILED";

        // @ts-expect-error
        if (status === "SUCCESS") fbq("track", "Subscribe", { value: "0.00", currency: "USD", predicted_ltv: "10.00" });
        // @ts-expect-error
        else if (status === "FAILED") fbq("trackCustom", "FailedCheckout", {});
    }

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
                        description="Select a collection. Ask a question. Receive the respone. Verify the information used to create the response."
                        icon={<Messages />}
                        url="/chat/conversations"
                    />,
                ]}
            />
        </SubAppShell>
    );
}

export default IndexPage;
