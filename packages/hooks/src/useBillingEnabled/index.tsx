import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { KEY_PORTAL } from "utils";
import { getPortal } from "helpers";
import { IProduct } from "types";
import { useNotification } from "providers";

export function useBillingEnabled(product: IProduct) {
    const session = useSession();
    const { addNotification } = useNotification();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    useQuery([KEY_PORTAL, product], () => getPortal(token as string, product), {
        enabled: !!token,
        onSuccess: (portal) =>
            !portal.active &&
            addNotification({
                title: "Not subscribed",
                description:
                    "You have not yet subscribed to this feature. As a result, your access may be restricted. To fix this, navigate to the 'Billing' tab and subscribe to the feature.",
                severity: "warning",
            }),
    });
}

export default useBillingEnabled;
