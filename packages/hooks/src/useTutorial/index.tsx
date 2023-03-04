import { useQuery } from "@tanstack/react-query";
import { getPortal } from "helpers";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { KEY_PORTAL, KEY_STORAGE_TUTORIAL, products } from "utils";

export function useTutorial() {
    const [isActive, setIsActive] = useState<boolean>(false);
    const [isUnsubscribed, setIsUnsubscribed] = useState<boolean>(false);
    const session = useSession();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    useQuery([KEY_PORTAL], () => getPortal(token as string, products), {
        enabled: !!token,
        onSuccess: (portal) => !portal.active && setIsUnsubscribed(true),
    });

    useEffect(() => {
        if (!isUnsubscribed) return;

        const exists = localStorage.getItem(KEY_STORAGE_TUTORIAL);

        if (!exists) setIsActive(true);
    }, [isUnsubscribed]);

    const completeTutorial = () => {
        localStorage.setItem(KEY_STORAGE_TUTORIAL, "true");

        setIsActive(false);
    };

    return { isActive, completeTutorial };
}
