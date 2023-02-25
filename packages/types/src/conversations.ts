import { z } from "zod";
import { conversation } from "./conversation";

export const conversations = z.object({
    conversations: z.array(conversation),
});

export type IConversations = z.infer<typeof conversations>;
