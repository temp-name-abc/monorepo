import { createContext } from "react";
import { INotification } from "types";

export const notificationCtx = createContext<[INotification | undefined, (notification: INotification | undefined) => void]>(undefined as any);

export default notificationCtx;
