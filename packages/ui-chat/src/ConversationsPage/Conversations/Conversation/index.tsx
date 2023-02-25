import { IConversation } from "types";
import { Button } from "ui";

interface IProps {
    conversation: IConversation;
    conversationId: string;
    setConversationId: (conversationId: string) => void;
}

export function Conversation({ conversation, conversationId, setConversationId }: IProps) {
    return (
        <Button
            type="button"
            variant={conversationId === conversation.conversationId ? "accent" : "dull"}
            thick={true}
            onClick={() => setConversationId(conversation.conversationId)}
        >
            {conversation.name}
        </Button>
    );
}

export default Conversation;
