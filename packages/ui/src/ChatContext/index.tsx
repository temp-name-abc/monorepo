import { IChat } from "types";
import Link from "next/link";

interface IProps {
    chat: IChat;
}

export function ChatContext({ chat }: IProps) {
    return (
        <div className="flex flex-col space-y-12">
            <header className="space-y-3">
                <h3 className="text-gray-900 font-bold text-xl">{`Chat / Context / ${chat.chatId}`}</h3>
                <p className="font-medium text-gray-600">View the context provided to the AI which was used to generate the chat.</p>
            </header>
            <div className="flex flex-col space-y-8">
                {chat.context.map((context, i) => (
                    <div className="flex flex-col space-y-4 bg-gray-100 px-8 py-4">
                        <div key={i} className="italic text-gray-600 font-medium text-sm">
                            {context.body}
                        </div>
                        <div className="flex space-x-2">
                            <Link className="cursor-pointer font-bold text-gray-600 hover:text-gray-700" href={`/storage/collections/${context.collectionId}`}>
                                Collection
                            </Link>
                            <span className="font-bold text-gray-600">/</span>
                            <Link href="#" className="cursor-pointer font-medium text-gray-600 hover:text-gray-700">
                                Document
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ChatContext;
