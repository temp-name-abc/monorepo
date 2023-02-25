import axios from "axios";
import { conversations, IConversations } from "types";

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
