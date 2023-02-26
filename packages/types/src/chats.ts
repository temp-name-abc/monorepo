import { z } from "zod";
import { chat } from "./chat";

export const chats = z.object({
    chats: z.array(chat),
});

export type IChats = z.infer<typeof chats>;
