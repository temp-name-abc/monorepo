import { z } from "zod";

export const collection = z.object({
    collectionId: z.string(),
    name: z.string(),
});

export type ICollection = z.infer<typeof collection>;
