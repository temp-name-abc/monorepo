import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChat } from "helpers";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { IChats } from "types";
import { TextCreate } from "ui";
import { chatData, KEY_CONVERSATION } from "utils";
import { SelectCollection } from "./SelectCollection";

interface IProps {
    conversationId: string;
    setQuestion: (question: string) => void;
    setIsTyping: (isTyping: boolean) => void;
    chatsData?: IChats;
}

export function ChatInput({ conversationId, chatsData, setIsTyping, setQuestion }: IProps) {
    const session = useSession();
    const queryClient = useQueryClient();
    const [collectionId, setCollectionId] = useState<string>("");

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { mutate: chatMutation, isLoading: isTyping } = useMutation({
        mutationFn: (args: { token: string; conversationId: string; question: string; collectionId?: string; prevChatId?: string }) =>
            createChat(args.token, args.conversationId, args.question, args.collectionId, args.prevChatId),
        onSuccess: (_, { conversationId }) => queryClient.invalidateQueries([KEY_CONVERSATION, conversationId]),
    });

    useEffect(() => {
        setIsTyping(isTyping);
    }, [isTyping]);

    if (!chatsData) return null;

    return (
        <div className="w-full flex space-x-8">
            <SelectCollection chatsData={chatsData} setCollectionId={setCollectionId} />
            <TextCreate
                onClick={(question) => {
                    const chats = chatsData.chats;
                    let prevChatId: string | undefined = undefined;

                    if (chats.length !== 0) {
                        const history = chats[chats.length - 1].history;
                        prevChatId = history[history.length - 1].chatId;
                    }

                    setQuestion(question);

                    token && conversationId && chatMutation({ token, conversationId, question, collectionId, prevChatId });
                }}
                cta="Send"
                placeholder="Send a chat"
                disabled={isTyping || !collectionId}
                maxCharacters={chatData.maxCharacters}
            />
        </div>
    );
}

export default ChatInput;
