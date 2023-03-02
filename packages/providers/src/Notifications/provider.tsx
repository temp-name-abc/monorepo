import { useRef, useState } from "react";
import { INotification } from "types";
import { notificationCtx } from "./context";

interface IProps {
    children: any;
}

export function NotificationProvider({ children }: IProps) {
    const [queue, setQueue] = useState<INotification[]>([]);
    const exists = useRef<{ [key: string]: boolean }>({});

    function addNotification(notification: INotification) {
        setQueue((prev) => {
            const hashKey = JSON.stringify(notification);

            if (exists.current[hashKey] === undefined) exists.current[hashKey] = true;
            else return prev;

            return [...prev, notification];
        });
    }

    function removeNotification() {
        if (queue.length === 0) return undefined;

        setQueue((prev) => {
            const hashKey = JSON.stringify(prev[0]);

            delete exists.current[hashKey];

            return prev.slice(1);
        });
    }

    const currentNotification = queue.length > 0 ? queue[0] : undefined;

    return <notificationCtx.Provider value={{ addNotification, removeNotification, currentNotification }}>{children}</notificationCtx.Provider>;
}

export default NotificationProvider;
