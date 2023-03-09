import { z } from "zod";

export const portalData = z.object({
    url: z.string(),
    active: z.boolean(),
    status: z.string(),
});

export type IPortalData = z.infer<typeof portalData>;
