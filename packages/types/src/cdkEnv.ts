import { z } from "zod";

export const cdkEnv = z.object({
    googleClientId: z.string(),
    googleClientSecret: z.string(),
    homeUrl: z.string(),
    apiUrl: z.string(),
});

export type ICdkEnv = z.infer<typeof cdkEnv>;
