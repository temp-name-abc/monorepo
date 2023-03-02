import { IChat, IChats } from "types";
import { ChatBubble } from "./ChatBubble";
import { Chat } from "./Chat";
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "../ChatInput";

interface IProps {
    chats?: IChats;
    question?: string;
    onClickReply?: (chat: IChat) => void;
}

export function ChatWindow({ chats, question, onClickReply }: IProps) {
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [question, setQuestion] = useState<string>("");

    const chatWindowRef = useRef(null);

    useEffect(() => {
        // @ts-expect-error
        chatWindowRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [chats, question]);

    if (!chats) return null;

    return (
        <div className="bg-gray-100 p-10 space-y-8 h-[640px] overflow-y-auto">
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
                <ChatInput conversationId={conversationId} setQuestion={setQuestion} setIsTyping={setIsTyping} chatsData={chatsData} />
                <div ref={chatWindowRef} />
            </div>
        </div>
    );
}

export default ChatWindow;
