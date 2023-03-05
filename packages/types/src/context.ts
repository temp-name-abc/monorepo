import { z } from "zod";

export const context = z.object({
    score: z.number(),
    documentId: z.string(),
    collectionId: z.string(),
    startChunkNum: z.number(),
    endChunkNum: z.number(),
    body: z.string(),
});

export type IContext = z.infer<typeof context>;
