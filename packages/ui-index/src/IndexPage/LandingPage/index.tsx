import Head from "next/head";
import { Header } from "./Header";
import { Instructions } from "./Instructions";

interface IProps {}

export function LandingPage({}: IProps) {
    return (
        <>
            <Head>
                <title>MonoStack - Don't search, just ask</title>
                <meta
                    name="description"
                    content="The number one platform powering natural language conversations with your data. Don't let your customers search for information, let them ask for it."
                />
                <link rel="shortcut icon" href="/images/favicon.ico" />
            </Head>
            <div className="space-y-10">
                <Header />
                <Instructions />
            </div>
        </>
    );
}

// import { Database, Messages } from "tabler-icons-react";

// <CardLayout
//     elements={[
//         <Card
//             title="Storage"
//             description="Create a collection. Upload your documents. Use the collection as a knowledgebase for chatting."
//             icon={<Database />}
//             url="/storage/collections"
//         />,
//         <Card
//             title="Chat"
//             description="Select a collection. Ask a question. Receive the respone. Verify the sources used."
//             icon={<Messages />}
//             url="/chat/conversations"
//         />,
//     ]}
// />

export default LandingPage;
