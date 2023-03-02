import { useState } from "react";
import { INotification } from "types";
import { notificationCtx } from "./context";

interface IProps {
    children: any;
}

export function NotificationProvider({ children }: IProps) {
    const [queue, setQueue] = useState<INotification[]>([]);

    function addNotification(notification: INotification) {
        setQueue((prev) => [...prev, notification]);
    }

    function removeNotification() {
        if (queue.length === 0) return undefined;

        setQueue((prev) => prev.slice(1));
    }

    const currentNotification = queue.length > 0 ? queue[0] : undefined;

    return <notificationCtx.Provider value={{ addNotification, removeNotification, currentNotification }}>{children}</notificationCtx.Provider>;
}

export default NotificationProvider;
