import { z } from "zod";

export const product = z.enum(["chat.conversation.chat", "storage.collection.document.process"]);

export type IProduct = z.infer<typeof product>;
