import { z } from "zod";

export const cdkEnv = z.object({
    googleClientId: z.string(),
    googleClientSecret: z.string(),
});

export type ICdkEnv = z.infer<typeof cdkEnv>;
