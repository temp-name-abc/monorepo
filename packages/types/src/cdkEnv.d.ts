import * as z from "zod";

export const cdkEnv = z.object({
    stripeKey: z.string(),
});

export type ICdkEnv = z.TypeOf<typeof cdkEnv>;
