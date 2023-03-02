import { useContext } from "react";
import { notificationCtx } from "./context";

export function useNotification() {
    const [notification, setNotification] = useContext(notificationCtx);

    return { notification, setNotification };
}

export default useNotification;
