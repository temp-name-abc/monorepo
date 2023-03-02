import { Database, Messages } from "tabler-icons-react";
import { Card, CardLayout, SubAppShell } from "ui";

interface IProps {}

export function IndexPage({}: IProps) {
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