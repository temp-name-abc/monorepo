import { Conversation } from "./Conversation";
import { IConversations } from "types";

interface IProps {
    conversations?: IConversations;
    conversationId: string;
    setConversationId: (conversationId: string) => void;
}

export function Conversations({ conversations, conversationId, setConversationId }: IProps) {
    if (!conversations) return null;

    if (conversations.conversations.length > 0)
        return (
            <div className="flex flex-col space-y-2">
                {conversations.conversations.map((conversation, i) => (
                    <Conversation key={i} conversation={conversation} conversationId={conversationId} setConversationId={setConversationId} />
                ))}
            </div>
        );

    return <p className="text-center font-medium text-gray-600">No conversations yet. Create one to get started!</p>;
}

export default Conversations;
