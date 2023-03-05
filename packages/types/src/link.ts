import { z } from "zod";

export const link = z.object({
    href: z.string(),
    children: z.any(),
    icon: z.any(),
});

export type ILink = z.infer<typeof link>;
