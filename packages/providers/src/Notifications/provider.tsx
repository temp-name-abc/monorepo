import { useState } from "react";
import { INotification } from "types";
import { notificationCtx } from "./context";

interface IProps {
    children: any;
}

export function NotificationProvider({ children }: IProps) {
    const state = useState<INotification | undefined>(undefined);

    return <notificationCtx.Provider value={state}>{children}</notificationCtx.Provider>;
}

export default NotificationProvider;
