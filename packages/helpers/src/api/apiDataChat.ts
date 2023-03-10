import axios from "axios";
import { chat, chats, conversation, conversations, IChat, IChatData, IChats, IConversation, IConversations } from "types";
import { API_BASE_URL } from "utils";

const instance = axios.create({
    baseURL: API_BASE_URL,
});

export async function getConversations(token: string) {
    const { data } = await instance.get<IConversations>("/chat/conversation", {
        headers: {
            Authorization: token,
        },
    });

    return conversations.parse(data);
}

export async function createConversation(token: string, name: string) {
    const { data } = await instance.post<IConversation>(
        "/chat/conversation",
        {
            name,
        },
        {
            headers: {
                Authorization: token,
            },
        }
    );

    return conversation.parse(data);
}

export async function getChats(token: string, conversationId: string) {
    const { data } = await instance.get<IChats>(`/chat/conversation/${conversationId}/chat`, {
        headers: {
            Authorization: token,
        },
    });

    return chats.parse(data);
}

export async function createChat(token: string, conversationId: string, question: string, collectionId: string, chatData?: IChatData) {
    if (!chatData)
        chatData = {
            maxDocuments: 2,
            minThreshold: 0.7,
            maxCharOut: 2000,
            extendDown: 1,
            extendUp: 0,
        };

    const { data } = await instance.post<IChat>(
        `/chat/conversation/${conversationId}/chat`,
        { ...{ collectionId, question }, ...chatData },
        {
            headers: {
                Authorization: token,
            },
        }
    );

    return chat.parse(data);
}
