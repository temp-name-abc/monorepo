import { z } from "zod";

export const notificationSeverity = z.enum(["success", "warning", "error"]);

export type INotificationSeverity = z.infer<typeof notificationSeverity>;
