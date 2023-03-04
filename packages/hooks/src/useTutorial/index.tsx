import { useEffect, useState } from "react";
import { KEY_STORAGE_TUTORIAL } from "utils";

export function useTutorial() {
    const [isActive, setIsActive] = useState<boolean>(false);

    useEffect(() => {
        const exists = localStorage.getItem(KEY_STORAGE_TUTORIAL);

        if (!exists) setIsActive(true);
    }, []);

    const completeTutorial = () => {
        localStorage.setItem(KEY_STORAGE_TUTORIAL, "true");

        setIsActive(false);
    };

    return { isActive, completeTutorial };
}
