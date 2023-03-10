import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { KEY_STORAGE_TUTORIAL } from "utils";

export function useTutorial() {
    const [isActive, setIsActive] = useState<boolean>(false);
    const session = useSession();

    useEffect(() => {
        if (session.status === "loading" || session.status === "authenticated") return;

        const exists = localStorage.getItem(KEY_STORAGE_TUTORIAL);

        if (!exists) setIsActive(true);
    }, [session]);

    const completeTutorial = () => {
        localStorage.setItem(KEY_STORAGE_TUTORIAL, "true");

        setIsActive(false);
    };

    return { isActive, completeTutorial };
}
