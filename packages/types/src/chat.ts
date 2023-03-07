import { z } from "zod";
import { context } from "./context";

export const chat = z.object({
    conversationId: z.string(),
    chatId: z.string(),
    question: z.string(),
    answer: z.string(),
    context: z.array(context),
    timestamp: z.number(),
});

export type IChat = z.infer<typeof chat>;
