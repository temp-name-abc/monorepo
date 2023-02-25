import { z } from "zod";

import { envVariable } from "./envVariable";

export const cdkEnv = z.object({
    googleClientId: envVariable,
    googleClientSecret: envVariable,
    homeUrl: envVariable,
    apiUrl: envVariable,
    pineconeEnv: envVariable,
    pineconeIndex: envVariable,
    productIdDocumentProcessText: envVariable,
    productIdChat: envVariable,
});

export type ICdkEnv = z.infer<typeof cdkEnv>;
