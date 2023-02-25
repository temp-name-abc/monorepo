import { z } from "zod";
import { document } from "./document";

export const documents = z.object({
    documents: z.array(document),
});

export type IDocuments = z.infer<typeof documents>;
