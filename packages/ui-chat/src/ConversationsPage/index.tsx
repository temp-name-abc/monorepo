import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SubAppShell } from "ui/src/SubAppShell";
import { links } from "../links";
import { useSession } from "next-auth/react";
import { chatData, KEY_CHATS, KEY_COLLECTIONS, KEY_CONVERSATIONS } from "utils";
import { createChat, createConversation, getChats, getCollections, getConversations } from "helpers";
import { Conversations } from "./Conversations";
import { useEffect, useState } from "react";
import ChatWindow from "./ChatWindow";
import { DropdownSelect, TextCreate, ChatContext } from "ui";
import { IChat } from "types";

interface IProps {}

export function ConversationsPage({}: IProps) {
    const session = useSession();
    const queryClient = useQueryClient();

    const [conversationId, setConversationId] = useState<string>("");
    const [question, setQuestion] = useState<string>("");
    const [collectionId, setCollectionId] = useState<string>("");
    const [selectedChat, setSelectedChat] = useState<IChat | null>(null);

    useEffect(() => {
        setSelectedChat(null);
    }, [conversationId, setSelectedChat]);

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data: conversationsData } = useQuery([KEY_CONVERSATIONS], () => getConversations(token as string), {
        enabled: !!token,
    });

    const { mutate: conversationMutate, isLoading: isMutatingConversation } = useMutation({
        mutationFn: (args: { token: string; name: string }) => createConversation(args.token, args.name),
        onSuccess: () => queryClient.invalidateQueries([KEY_CONVERSATIONS]),
    });

    const { data: chatsData } = useQuery([KEY_CHATS, conversationId], () => getChats(token as string, conversationId), {
        enabled: !!token && !!conversationId,
    });

    const { mutate: chatMutation, isLoading: isMutatingChat } = useMutation({
        mutationFn: (args: { token: string; conversationId: string; question: string; collectionId?: string; prevChatId?: string }) =>
            createChat(args.token, args.conversationId, args.question, args.collectionId, args.prevChatId),
        onSuccess: (_, { conversationId }) => queryClient.invalidateQueries([KEY_CHATS, conversationId]),
    });

    const { data: collectionsData } = useQuery([KEY_COLLECTIONS], () => getCollections(token as string), {
        enabled: !!token,
    });

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
                {chatsData && (
                    <div className="flex flex-col space-y-12 w-3/4">
                        <ChatWindow chats={chatsData} question={isMutatingChat ? question : undefined} onClickReply={setSelectedChat} />
                        <div className="flex space-x-8">
                            {collectionsData && (
                                <div className="w-1/4">
                                    <DropdownSelect
                                        options={collectionsData.collections.map((collection) => [collection.collectionId, collection.name])}
                                        onChange={setCollectionId}
                                        selected={(() => {
                                            const chats = chatsData.chats;

                                            if (chats.length !== 0) {
                                                const context = chats[chats.length - 1].context;

                                                if (context.length !== 0) return context[context.length - 1].collectionId;
                                            }
                                        })()}
                                    />
                                </div>
                            )}
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
                                disabled={isMutatingChat || !collectionId}
                                maxCharacters={chatData.maxCharacters}
                            />
                        </div>
                        {selectedChat && <ChatContext chat={selectedChat} />}
                    </div>
                )}
            </div>
        </SubAppShell>
    );
}

export default ConversationsPage;
