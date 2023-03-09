import { z } from "zod";

export const product = z.enum(["chat.per_ctx_chunk", "chat.per_char_in", "chat.per_char_out", "storage.per_char"]);

export type IProduct = z.infer<typeof product>;
