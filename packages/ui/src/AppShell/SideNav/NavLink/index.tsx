import Link from "next/link";

interface IProps {
    text: string;
    href: string;
}

export function NavLink({ text, href }: IProps) {
    return (
        <Link className="font-medium text-gray-400 bg-gray-100 hover:bg-gray-200 px-8 py-4" href={href}>
            {text}
        </Link>
    );
}

export default NavLink;
