import Link from "next/link";
import { ReactNode } from "react";

interface IProps {
    text: string;
    href: string;
    icon: ReactNode;
}

export function NavLink({ text, href, icon }: IProps) {
    return (
        <Link className="font-medium text-gray-400 bg-gray-100 hover:bg-gray-200 px-5 py-4" href={href}>
            <div className="flex items-center justify-start space-x-5">
                <span>{icon}</span>
                <span>{text}</span>
            </div>
        </Link>
    );
}

export default NavLink;
