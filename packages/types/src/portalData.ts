import { z } from "zod";

export const portalData = z.object({
    url: z.string(),
    active: z.boolean(),
    status: z.enum(["SANDBOX", "TRIALING_CARD", "TRIALING_NO_CARD", "CARD", "NOT_SUBSCRIBED_TRIAL_ENDED", "NOT_SUBSCRIBED"]),
});

export type IPortalData = z.infer<typeof portalData>;
