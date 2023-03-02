import { links } from "../links";
import { useSession } from "next-auth/react";
import { KEY_CONVERSATION, KEY_CONVERSATIONS } from "utils";
import { createConversation, getChats, getConversations } from "helpers";
import { Conversations } from "./Conversations";
import { useEffect, useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { TextCreate, ChatContext, SubAppShell } from "ui";
import { IChat } from "types";
import { ChatInput } from "./ChatInput";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBillingEnabled } from "hooks";

interface IProps {}

export function ConversationsPage({}: IProps) {
    const session = useSession();
    const queryClient = useQueryClient();
    useBillingEnabled("chat.conversation.chat");

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
    });

    const { data: chatsData } = useQuery([KEY_CONVERSATION, conversationId], () => getChats(token as string, conversationId), {
        enabled: !!token && !!conversationId,
    });

    useEffect(() => {
        setSelectedChat(null);
    }, [conversationId, setSelectedChat]);

    return (
        <SubAppShell title="Chat / Conversations" description="View all your conversations." links={links}>
            <div className="flex space-x-10">
                <div className={`flex flex-col space-y-12 ${chatsData ? "w-1/4" : "w-full"}`}>
                    <TextCreate
                        onClick={(name) => token && conversationMutate({ token, name })}
                        cta="Create"
                        placeholder="Create a conversation"
                        disabled={isMutatingConversation}
                    />
                    <Conversations conversations={conversationsData} conversationId={conversationId} setConversationId={setConversationId} />
                </div>
                <div className="flex flex-col space-y-12 w-3/4">
                    <ChatWindow chats={chatsData} question={isTyping ? question : undefined} onClickReply={setSelectedChat} />
                    {selectedChat && <ChatContext chat={selectedChat} />}
                </div>
            </div>
        </SubAppShell>
    );
}

export default ConversationsPage;
