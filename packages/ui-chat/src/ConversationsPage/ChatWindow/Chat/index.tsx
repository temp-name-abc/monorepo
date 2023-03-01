import { IChat } from "types";
import { ChatBubble } from "../ChatBubble";

interface IProps {
    chat: IChat;
    onClickReply?: (chat: IChat) => void;
}

export function Chat({ chat, onClickReply }: IProps) {
    const history = chat.history[chat.history.length - 1];

    return (
        <div className="flex flex-col space-y-8">
            <ChatBubble style="right">{history.human}</ChatBubble>
            <ChatBubble style="left" onClick={() => onClickReply && onClickReply(chat)}>
                {history.ai}
            </ChatBubble>
        </div>
    );
}

export default Chat;
