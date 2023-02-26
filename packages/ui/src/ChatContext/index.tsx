import { IChat } from "types";

interface IProps {
    chat: IChat;
}

export function ChatContext({ chat }: IProps) {
    return (
        <div>
            <h3>Context for chat {chat.chatId}</h3>
        </div>
    );
}

export default ChatContext;
