import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SubAppShell } from "ui/src/SubAppShell";
import { links } from "../links";
import { useSession } from "next-auth/react";
import { KEY_CONVERSATIONS } from "utils";
import { createConversation, getConversations } from "helpers";
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

    const {data: chatsData} = useQuery([KEY_CHAT, conversationId], () => )

    const mutation = useMutation({
        mutationFn: (args: { token: string; name: string }) => createConversation(args.token, args.name),
        onSuccess: () => queryClient.invalidateQueries([KEY_CONVERSATIONS]),
    });

    return (
        <SubAppShell title="Chat / Conversations" description="View all your conversations." links={links}>
            <div className="flex space-x-10">
                <div className="flex flex-col space-y-12 w-full">
                    <TextCreate onClick={(name) => token && mutation.mutate({ token, name })} />
                    <Conversations conversations={conversationsData} conversationId={conversationId} setConversationId={setConversationId} />
                </div>
                <ChatWindow />
            </div>
        </SubAppShell>
    );
}

export default ConversationsPage;
