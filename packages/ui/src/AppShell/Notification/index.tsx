import { useNotification } from "providers";
import { AlertCircle, AlertTriangle, CircleCheck, X } from "tabler-icons-react";
import { INotification, INotificationSeverity } from "types";

interface IProps {
    notification?: INotification;
}

export function Notification({ notification }: IProps) {
    const { setNotification } = useNotification();

    const mapping: { [key in INotificationSeverity]: { color: string; icon: any } } = {
        success: {
            color: "text-green-400",
            icon: <CircleCheck />,
        },
        warning: {
            color: "text-yellow-500",
            icon: <AlertTriangle />,
        },
        error: {
            color: "text-red-500",
            icon: <AlertCircle />,
        },
    };

    if (!notification) return null;

    return (
        <div className="bg-gray-50 p-8 w-full space-y-2">
            <div className="flex items-center justify-between font-bold">
                <h3 className={`flex items-center space-x-4 ${mapping[notification.severity].color}`}>
                    <span>{mapping[notification.severity].icon}</span>
                    <span>{notification.title}</span>
                </h3>
                <button className="text-gray-900" onClick={() => setNotification(undefined)}>
                    <X />
                </button>
            </div>
            <p className="font-medium text-gray-600 text-sm">{notification.description}</p>
        </div>
    );
}

export default Notification;
