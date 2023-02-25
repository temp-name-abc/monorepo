import axios from "axios";
import { conversation, conversations, IConversation, IConversations } from "types";

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
    const { data } = await instance.get();
}
