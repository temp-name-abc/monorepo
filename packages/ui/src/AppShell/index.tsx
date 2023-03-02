import { Nav } from "./Nav";
import { SideNav } from "./SideNav";
import { Notification } from "./Notification";
import { useNotification } from "providers";
import { INotification } from "types";

interface IProps {
    children: any;
}

export function AppShell({ children }: IProps) {
    const { currentNotification } = useNotification();

    return (
        <>
            <Nav />
            <div className="flex items-stretch">
                <SideNav />
                <div className="m-10 w-full space-y-10">
                    <Notification notification={currentNotification} />
                    <div className="bg-gray-50">{children}</div>
                </div>
            </div>
        </>
    );
}

export default AppShell;
