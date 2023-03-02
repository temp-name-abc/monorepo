import { useContext } from "react";
import { notificationCtx } from "./context";

export function useNotification() {
    return useContext(notificationCtx);
}

export default useNotification;
