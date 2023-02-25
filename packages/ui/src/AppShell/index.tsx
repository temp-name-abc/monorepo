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
                <div className="m-10 bg-gray-50 w-full">{children}</div>
            </div>
        </>
    );
}

export default AppShell;
