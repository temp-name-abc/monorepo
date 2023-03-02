import { z } from "zod";
import { notificationSeverity } from "./notificationSeverity";

export const notification = z.object({
    title: z.string(),
    description: z.string(),
    severity: notificationSeverity,
});

export type INotification = z.infer<typeof notification>;
