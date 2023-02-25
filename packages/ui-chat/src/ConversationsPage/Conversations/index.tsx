import { Conversation } from "./Conversation";
import { IConversations } from "types";

interface IProps {
    conversations?: IConversations;
    conversationId: string;
    setConversationId: (conversationId: string) => void;
}

export function Conversations({ conversations, conversationId, setConversationId }: IProps) {
    if (!conversations) return null;

    return (
        <div className="flex flex-col space-y-2">
            {conversations.conversations.map((conversation, i) => (
                <Conversation key={i} conversation={conversation} conversationId={conversationId} setConversationId={setConversationId} />
            ))}
        </div>
    );
}

export default Conversations;
