import { Conversation } from "./Conversation";
import { IConversations } from "types";

interface IProps {
    conversations?: IConversations;
}

export function Conversations({ conversations }: IProps) {
    if (!conversations) return null;

    return (
        <div className="flex flex-col">
            {conversations.conversations.map((conversation, i) => (
                <Conversation key={i} conversation={conversation} />
            ))}
        </div>
    );
}

export default Conversations;
