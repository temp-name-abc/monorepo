import { Folder, Search } from "tabler-icons-react";
import { SubAppShell } from "ui";

interface IProps {
    children: any;
}

export function StorageSubAppShell({ children }: IProps) {
    return (
        <SubAppShell
            links={[
                { href: "/storage/collections", children: "Collections", icon: <Folder /> },
                { href: "#", children: "Search", icon: <Search /> },
            ]}
        >
            {children}
        </SubAppShell>
    );
}

export default StorageSubAppShell;
