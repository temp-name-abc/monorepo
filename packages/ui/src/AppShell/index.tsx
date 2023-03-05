import { Nav } from "./Nav";
import { SideNav } from "./SideNav";
import { Notification } from "./Notification";
import { useNotification } from "providers";
import { NavSmall } from "./NavSmall";
import { SideNavSmall } from "./SideNavSmall";
import { useState } from "react";

interface IProps {
    children: any;
}

export function AppShell({ children }: IProps) {
    const { currentNotification } = useNotification();
    const [showSideNav, setShowSideNav] = useState<boolean>(false);

    return (
        <>
            <Nav />
            <NavSmall showSideNav={showSideNav} setShowSideNav={setShowSideNav} />
            {showSideNav && <SideNavSmall />}
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
