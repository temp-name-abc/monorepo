import { createContext } from "react";
import { INotification } from "types";

export const notificationCtx = createContext<{
    addNotification: (notification: INotification) => void;
    currentNotification: INotification | undefined;
    removeNotification: () => void;
}>(undefined as any);

export default notificationCtx;
