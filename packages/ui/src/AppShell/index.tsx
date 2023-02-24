import { Nav } from "./Nav";
import SideNav from "./SideNav";

interface IProps {
    children: any;
}

export function AppShell({ children }: IProps) {
    return (
        <>
            <Nav />
            <div className="flex items-stretch">
                <SideNav />
                <main className="m-10 p-10 bg-gray-50 w-full">{children}</main>
            </div>
        </>
    );
}

export default AppShell;
