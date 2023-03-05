import { Nav } from "./Nav";
import { SideNav } from "./SideNav";
import { Notification } from "./Notification";
import { useNotification } from "providers";
import { NavSmall } from "./NavSmall";
import { SideNavSmall } from "./SideNavSmall";
import { useState } from "react";
import { ILink } from "types";
import { BrandFacebook, Bucket, Lock, Message } from "tabler-icons-react";
import { FACEBOOK_URL, PRIVACY_POLICY_URL } from "utils";

interface IProps {
    children: any;
}

export function AppShell({ children }: IProps) {
    const { currentNotification } = useNotification();
    const [showSideNav, setShowSideNav] = useState<boolean>(false);

    const navigationLinks: ILink[] = [
        { href: "/storage/collections", children: "Storage", icon: <Bucket /> },
        { href: "/chat/conversations", children: "Chat", icon: <Message /> },
    ];

    const externalLinks: ILink[] = [
        { href: PRIVACY_POLICY_URL, children: "Privacy", icon: <Lock /> },
        { href: FACEBOOK_URL, children: "Facebook", icon: <BrandFacebook /> },
    ];

    return (
        <>
            <Nav />
            <NavSmall showSideNav={showSideNav} setShowSideNav={setShowSideNav} />
            {showSideNav && <SideNavSmall navigationLinks={navigationLinks} externalLinks={externalLinks} />}
            <div className="flex items-stretch">
                <SideNav navigationLinks={navigationLinks} externalLinks={externalLinks} />
                <div className="m-10 w-full space-y-10">
                    <Notification notification={currentNotification} />
                    <div className="bg-gray-50">{children}</div>
                </div>
            </div>
        </>
    );
}

export default AppShell;
