import { z } from "zod";

export const context = z.object({
    body: z.string(),
    documentId: z.string(),
    collectionId: z.string(),
    chunkId: z.string(),
    score: z.number(),
});

export type IContext = z.infer<typeof context>;
