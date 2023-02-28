import { z } from "zod";

export const chatData = z.object({
    chunkCharacters: z.number(),
    chatMemoryLength: z.number(),
    documentsRetrieved: z.number(),
    matchingThreshold: z.number(),
    maxCharacters: z.number(),
});

export type IChatData = z.infer<typeof chatData>;
