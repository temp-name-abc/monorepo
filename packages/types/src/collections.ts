import { z } from "zod";
import { collection } from "./collection";

export const collections = z.object({
    collections: z.array(collection),
});

export type ICollections = z.infer<typeof collections>;
