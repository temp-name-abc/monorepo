import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { KEY_PORTAL, products } from "utils";
import { getPortal } from "helpers";
import { useNotification } from "providers";

export function useBilling() {
    const session = useSession();
    const { addNotification } = useNotification();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    useQuery([KEY_PORTAL], () => getPortal(token as string, products), {
        enabled: !!token,
        onSuccess: (portal) =>
            !portal.active &&
            addNotification({
                title: "Not subscribed",
                description: "You have not yet subscribed to some features. As a result, your access may be restricted. To fix this, press 'Subscribe' in the navbar.",
                severity: "warning",
            }),
    });
}

export default useBilling;
