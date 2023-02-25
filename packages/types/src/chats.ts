import { z } from "zod";

export const chat = z.object({
    chatId: z.string(),
    context: null,
    timestamp: z.number(),
    body: z.object({
        chatId: z.string(),
        human: z.string(),
        ai: z.string(),
    }),
});

export type IChat = z.infer<typeof chat>;
