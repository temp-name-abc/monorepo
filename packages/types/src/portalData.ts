import { z } from "zod";

export const portalData = z.object({
    url: z.string(),
    active: z.boolean(),
});

export type IPortalData = z.infer<typeof portalData>;
