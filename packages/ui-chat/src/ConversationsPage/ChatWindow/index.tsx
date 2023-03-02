import { IChat, IChats } from "types";
import { ChatBubble } from "./ChatBubble";
import { Chat } from "./Chat";

interface IProps {
    chats?: IChats;
    question?: string;
    onClickReply?: (chat: IChat) => void;
}

export function ChatWindow({ chats, question, onClickReply }: IProps) {
    if (!chats) return null;

    return (
        <div className="bg-gray-100 p-10 space-y-8 h-[576px] overflow-y-auto">
            <ChatBubble style="centernobubble">Beginning of conversation</ChatBubble>
            <div className="flex flex-col space-y-8">
                {chats.chats.map((chat, i) => (
                    <Chat key={i} chat={chat} onClickReply={onClickReply} />
                ))}
                {question && (
                    <div className="flex flex-col space-y-8">
                        <ChatBubble style="right">{question}</ChatBubble>
                        <ChatBubble style="leftnobubble">Typing...</ChatBubble>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatWindow;
