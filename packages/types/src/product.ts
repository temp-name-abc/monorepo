import { z } from "zod";

export const product = z.enum(["chat.chat", "storage.document.process.text"]);

export type IProduct = z.infer<typeof product>;
