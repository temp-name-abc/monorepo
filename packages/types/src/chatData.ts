import { z } from "zod";

export const chatData = z.object({
    chunkCharacters: z.number(),
    maxDocuments: z.number(),
    minThreshold: z.number(),
    extendDown: z.number(),
    extendUp: z.number(),
    maxCharOut: z.number(),
});

export type IChatData = z.infer<typeof chatData>;
