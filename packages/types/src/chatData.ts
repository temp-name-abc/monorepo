import { z } from "zod";

export const chatData = z.object({
    chunkCharacters: z.number(),
    documentsRetrieved: z.number(),
    matchingThreshold: z.number(),
    maxCharacters: z.number(),
    extendDown: z.number(),
    extendUp: z.number(),
});

export type IChatData = z.infer<typeof chatData>;
