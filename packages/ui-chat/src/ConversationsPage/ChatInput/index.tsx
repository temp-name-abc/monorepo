import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChat } from "helpers";
import { useSession } from "next-auth/react";
import { useNotification } from "providers";
import { useEffect, useState } from "react";
import { Adjustments } from "tabler-icons-react";
import { IChatData, IChats } from "types";
import { Button, TextCreate } from "ui";
import { KEY_CONVERSATION } from "utils";
import { ChatSettings } from "./ChatSettings";
import { SelectCollection } from "./SelectCollection";
import { KEY_STORAGE_CHAT_SETTINGS } from "utils";

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
    const [showChatSettings, setShowChatSettings] = useState<boolean>(false);
    const [chatData, setChatData] = useState<IChatData | null>(null);

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { mutate: chatMutation, isLoading: isTyping } = useMutation({
        mutationFn: (args: { token: string; conversationId: string; question: string; collectionId: string; chatData: IChatData }) =>
            createChat(args.token, args.conversationId, args.question, args.collectionId, args.chatData),
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

    useEffect(() => {
        // Load the default chat settings
        const settingsString = localStorage.getItem(KEY_STORAGE_CHAT_SETTINGS);

        if (settingsString) setChatData(JSON.parse(settingsString));
        else
            setChatData({
                maxDocuments: 2,
                minThreshold: 0.7,
                maxCharOut: 2000,
                extendDown: 1,
                extendUp: 0,
            });
    }, []);

    useEffect(() => {
        // Save the current chat settings
        if (chatData) localStorage.setItem(KEY_STORAGE_CHAT_SETTINGS, JSON.stringify(chatData));
    }, [chatData]);

    if (!chatsData) return null;

    return (
        <div className="w-full flex flex-col space-y-6">
            <TextCreate
                onClick={(question) => {
                    setQuestion(question);
                    token && conversationId && collectionId && chatData && chatMutation({ token, conversationId, question, collectionId, chatData });
                }}
                cta="Send"
                placeholder="Send a chat"
                disabled={isTyping || !collectionId}
                textArea={true}
            />
            <div className="flex space-x-4">
                <Button type="button" variant="dull" onClick={() => setShowChatSettings((prev) => !prev)} icon={<Adjustments />} />
                <SelectCollection chatsData={chatsData} setCollectionId={setCollectionId} />
            </div>
            {showChatSettings && chatData && <ChatSettings chatData={chatData} setChatData={setChatData as any} />}
        </div>
    );
}

export default ChatInput;
