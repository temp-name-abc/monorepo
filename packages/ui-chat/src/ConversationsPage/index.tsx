import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SubAppShell } from "ui/src/SubAppShell";
import { links } from "../links";
import { useSession } from "next-auth/react";
import { KEY_CHATS, KEY_CONVERSATIONS } from "utils";
import { createChat, createConversation, getChats, getConversations } from "helpers";
import { Conversations } from "./Conversations";
import { TextCreate } from "ui/src/TextCreate";
import { useState } from "react";
import ChatWindow from "./ChatWindow";

interface IProps {}

export function ConversationsPage({}: IProps) {
    const session = useSession();
    const queryClient = useQueryClient();
    const [conversationId, setConversationId] = useState<string>("");

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data: conversationsData } = useQuery([KEY_CONVERSATIONS], () => getConversations(token as string), {
        enabled: !!token,
    });

    const conversationMutation = useMutation({
        mutationFn: (args: { token: string; name: string }) => createConversation(args.token, args.name),
        onSuccess: () => queryClient.invalidateQueries([KEY_CONVERSATIONS]),
    });

    const { data: chatsData } = useQuery([KEY_CHATS, conversationId], () => getChats(token as string, conversationId), {
        enabled: !!token && !!conversationId,
    });

    const { mutate: chatMutation, isLoading } = useMutation({
        mutationFn: (args: { token: string; conversationId: string; question: string }) => createChat(args.token, args.conversationId, args.question),
        onSuccess: (_, { conversationId }) => queryClient.invalidateQueries([KEY_CHATS, conversationId]),
    });

    // **** Make sure that we are chaining the previous chat ids together...
    // **** Also need to lock the search bar whilst we are fetching
    // **** Add the chat context section

    return (
        <SubAppShell title="Chat / Conversations" description="View all your conversations." links={links}>
            <div className="flex space-x-10">
                <div className="flex flex-col space-y-12 w-full">
                    <TextCreate onClick={(name) => token && conversationMutation.mutate({ token, name })} cta="Create" placeholder="Create a conversation" />
                    <Conversations conversations={conversationsData} conversationId={conversationId} setConversationId={setConversationId} />
                </div>
                {chatsData && (
                    <div className="flex flex-col space-y-12 w-full">
                        <ChatWindow chats={chatsData} />
                        <TextCreate
                            onClick={(question) => token && conversationId && chatMutation({ token, conversationId, question })}
                            cta="Send"
                            placeholder="Send a chat"
                        />
                    </div>
                )}
            </div>
        </SubAppShell>
    );
}

export default ConversationsPage;
