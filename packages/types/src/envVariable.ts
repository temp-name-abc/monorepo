import { z } from "zod";

export const envVariable = z.string();

export type IEnvVariable = z.infer<typeof envVariable>;
