import { z } from "zod";

export const document = z.object({
    documentId: z.string(),
    name: z.string(),
});

export type IDocument = z.infer<typeof document>;
