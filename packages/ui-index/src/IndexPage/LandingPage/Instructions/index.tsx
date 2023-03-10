import Link from "next/link";
import { Database, Messages } from "tabler-icons-react";
import { Card } from "ui";
import Instruction from "./Instruction";

interface IProps {}

export function Instructions({}: IProps) {
    return (
        <div className="p-16 flex flex-col xl:flex-row items-start justify-between space-y-16 xl:space-x-10 xl:space-y-0">
            <Instruction
                title={
                    <>
                        <Link href="/storage/collections" className="text-violet-600">
                            Upload
                        </Link>{" "}
                        Documents
                    </>
                }
                description={
                    <>
                        First, <span className="font-medium">create a collection</span> and <span className="font-medium">upload your documents</span> to our platform so
                        our AI can use them to answer your questions.
                    </>
                }
                card={
                    <Card
                        title="Storage"
                        description="Create a collection. Upload your documents. Use the collection as a knowledgebase for chatting."
                        icon={<Database />}
                        url="/storage/collections"
                    />
                }
            />
            <Instruction
                title={
                    <>
                        <Link href="/chat/conversations" className="text-violet-600">
                            Ask
                        </Link>{" "}
                        Questions
                    </>
                }
                description={
                    <>
                        Now that you've uploaded some documents, <span className="font-medium">ask questions</span> specific to those documents and receive{" "}
                        <span className="font-medium">accurate responses within seconds!</span> We also show you the sources the AI used to generate the response, so you
                        can <span className="font-medium">verify your answer</span> is correct.
                    </>
                }
                card={
                    <Card
                        title="Chat"
                        description="Select a collection. Ask a question. Receive the respone. Verify the sources used."
                        icon={<Messages />}
                        url="/chat/conversations"
                    />
                }
            />
        </div>
    );
}

export default Instructions;
