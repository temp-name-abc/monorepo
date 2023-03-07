import { IChat } from "types";
import { ChatBubble } from "../ChatBubble";

interface IProps {
    chat: IChat;
    onClickReply?: (chat: IChat) => void;
}

export function Chat({ chat, onClickReply }: IProps) {
    return (
        <div className="flex flex-col items-start space-y-8">
            <ChatBubble style="accent">{chat.question}</ChatBubble>
            <ChatBubble style="dull" onClick={() => onClickReply && onClickReply(chat)}>
                {chat.answer}
            </ChatBubble>
        </div>
    );
}

export default Chat;
