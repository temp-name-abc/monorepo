import { links } from "../links";
import { useSession } from "next-auth/react";
import { KEY_CONVERSATION, KEY_CONVERSATIONS } from "utils";
import { createConversation, getChats, getConversations } from "helpers";
import { Conversations } from "./Conversations";
import { useEffect, useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { TextCreate, ChatContext, SubAppShell } from "ui";
import { IChat } from "types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotification } from "providers";

interface IProps {}

export function ConversationsPage({}: IProps) {
    const session = useSession();
    const queryClient = useQueryClient();
    const { addNotification } = useNotification();

    const [conversationId, setConversationId] = useState<string>("");
    const [selectedChat, setSelectedChat] = useState<IChat | null>(null);

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data: conversationsData } = useQuery([KEY_CONVERSATIONS], () => getConversations(token as string), {
        enabled: !!token,
    });

    const { mutate: conversationMutate, isLoading: isMutatingConversation } = useMutation({
        mutationFn: (args: { token: string; name: string }) => createConversation(args.token, args.name),
        onSuccess: () => queryClient.invalidateQueries([KEY_CONVERSATIONS]),
        onError: (err) => {
            addNotification({
                title: "Could not create conversation",
                // @ts-expect-error
                description: `Not able to create new conversation for reason: '${err.message}'`,
                severity: "error",
            });
        },
    });

    const { data: chatsData } = useQuery([KEY_CONVERSATION, conversationId], () => getChats(token as string, conversationId), {
        enabled: !!token && !!conversationId,
    });

    useEffect(() => {
        setSelectedChat(null);
    }, [conversationId, setSelectedChat]);

    return (
        <SubAppShell
            title="Chat / Conversations"
            description="View all your conversations. Pick a collection, ask the AI questions about it, and get instant replies."
            links={links}
        >
            <div className="flex flex-col xl:flex-row xl:space-x-10 space-y-10 xl:space-y-0">
                <div className={`flex flex-col space-y-12 ${chatsData ? "w-full xl:w-1/4" : "w-full"}`}>
                    <TextCreate
                        onClick={(name) => token && conversationMutate({ token, name })}
                        cta="Create"
                        placeholder="Create a conversation"
                        disabled={isMutatingConversation}
                    />
                    <Conversations conversations={conversationsData} conversationId={conversationId} setConversationId={setConversationId} />
                </div>
                <div className="flex flex-col space-y-12 w-full xl:w-3/4">
                    <ChatWindow chats={chatsData} conversationId={conversationId} onClickReply={setSelectedChat} />
                    {selectedChat && <ChatContext chat={selectedChat} />}
                </div>
            </div>
        </SubAppShell>
    );
}

export default ConversationsPage;
