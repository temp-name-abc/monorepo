import { z } from "zod";

export const chat = z.object({
    conversationId: z.string(),
    chatId: z.string(),
    history: z.array(
        z.object({
            human: z.string(),
            ai: z.string(),
            chatId: z.string(),
        })
    ),
    context: z.array(
        z.object({
            body: z.string(),
            documentId: z.string(),
            collectionId: z.string(),
            chunkId: z.string(),
            score: z.number(),
        })
    ),
    timestamp: z.number(),
});

export type IChat = z.infer<typeof chat>;
