import { z } from "zod";

export const history = z.object({
    human: z.string(),
    ai: z.string(),
    chatId: z.string(),
});

export type IHistory = z.infer<typeof history>;
