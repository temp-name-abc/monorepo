import { z } from "zod";

export const conversation = z.object({
    conversationId: z.string(),
    name: z.string(),
});

export type IConversation = z.infer<typeof conversation>;
