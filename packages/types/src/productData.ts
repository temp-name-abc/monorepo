import { z } from "zod";

export const productData = z.object({
    name: z.string(),
    description: z.string(),
});

export type IProductData = z.infer<typeof productData>;
