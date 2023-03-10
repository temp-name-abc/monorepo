import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChat } from "helpers";
import { useSession } from "next-auth/react";
import { useNotification } from "providers";
import { useEffect, useState } from "react";
import { IChats } from "types";
import { TextCreate } from "ui";
import { KEY_CONVERSATION } from "utils";
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
    const { addNotification } = useNotification();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { mutate: chatMutation, isLoading: isTyping } = useMutation({
        mutationFn: (args: { token: string; conversationId: string; question: string; collectionId: string }) =>
            createChat(args.token, args.conversationId, args.question, args.collectionId),
        onSuccess: (_, { conversationId }) => queryClient.invalidateQueries([KEY_CONVERSATION, conversationId]),
        onError: (err) => {
            addNotification({
                title: "Could not send message",
                // @ts-expect-error
                description: `Not able to send message for reason: '${err.message}'`,
                severity: "error",
            });
        },
    });

    useEffect(() => {
        setIsTyping(isTyping);
    }, [isTyping, setIsTyping]);

    if (!chatsData) return null;

    return (
        <div className="w-full flex flex-col space-y-4">
            <TextCreate
                onClick={(question) => {
                    setQuestion(question);
                    token && conversationId && collectionId && chatMutation({ token, conversationId, question, collectionId });
                }}
                cta="Send"
                placeholder="Send a chat"
                disabled={isTyping || !collectionId}
            />
            <SelectCollection chatsData={chatsData} setCollectionId={setCollectionId} />
        </div>
    );
}

export default ChatInput;
