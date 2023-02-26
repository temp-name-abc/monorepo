import { useEffect, useRef } from "react";
import { IChats } from "types";
import { ChatBubble } from "ui";
import { Chat } from "./Chat";

interface IProps {
    chats: IChats;
    question?: string;
}

export function ChatWindow({ chats, question }: IProps) {
    const bottomRef = useRef(null);

    useEffect(() => {
        // @ts-expect-error
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chats]);

    return (
        <div className="h-[496px] bg-gray-100 p-10 space-y-8 overflow-y-auto">
            <ChatBubble style="centernobubble">Beginning of conversation</ChatBubble>
            <div className="flex flex-col space-y-8">
                {chats.chats.map((chat, i) => {
                    const history = chat.history[chat.history.length - 1];

                    return <Chat key={i} user={history.human} other={history.ai} />;
                })}
                {question && <Chat user={question} />}
            </div>
            <div ref={bottomRef} />
        </div>
    );
}

export default ChatWindow;
