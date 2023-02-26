import { useEffect, useRef } from "react";
import { IChats } from "types";
import Chat from "./Chat";

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
            <p className="text-center font-medium text-gray-400">Beginning of conversation</p>
            <div className="flex flex-col space-y-8">
                {chats.chats.map((chat, i) => (
                    <Chat key={i} chat={chat} />
                ))}
            </div>
            {question && <p>{question}</p>}
            <div ref={bottomRef} />
        </div>
    );
}

export default ChatWindow;
