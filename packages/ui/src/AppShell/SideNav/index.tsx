import { NavLink } from "./NavLink";

interface IProps {}

export function SideNav({}: IProps) {
    return (
        <div className="flex h-screen">
            <div className="bg-gray-50 w-64 py-5 px-10">
                <div className="flex flex-col space-y-5">
                    <NavLink text="Storage" href="#" />
                    <NavLink text="Search" href="#" />
                </div>
            </div>
        </div>
    );
}

export default SideNav;
