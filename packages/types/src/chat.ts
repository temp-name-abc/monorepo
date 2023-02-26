import { z } from "zod";
import { context } from "./context";
import { history } from "./history";

export const chat = z.object({
    conversationId: z.string(),
    chatId: z.string(),
    history: z.array(history),
    context: z.array(context),
    timestamp: z.number(),
});

export type IChat = z.infer<typeof chat>;
