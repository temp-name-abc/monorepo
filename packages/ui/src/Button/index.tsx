import Link from "next/link";
import { ReactNode } from "react";

interface IProps {
    children: any;
    type: "button" | "link";
    variant: "dull" | "accent";
    onClick?: (e: any) => any;
    href?: string;
    icon?: ReactNode;
    thick?: boolean;
}

export function Button({ children, type, variant, onClick, href, icon, thick }: IProps) {
    const color = variant === "dull" ? "text-gray-400 bg-gray-100 hover:bg-gray-200" : "text-gray-50 bg-violet-600 hover:bg-violet-700";
    const paddingY = thick ? "py-4" : "py-2";
    const spacing = icon ? "space-x-8" : "";

    const style = `font-medium px-4 flex justify-between ${spacing} ${paddingY} ${color}`;

    if (type === "button")
        return (
            <button className={style} onClick={onClick}>
                <span>{children}</span>
                <span>{icon}</span>
            </button>
        );
    else if (type === "link" && !!href)
        return (
            <Link className={style} onClick={onClick} href={href}>
                <span>{children}</span>
                <span>{icon}</span>
            </Link>
        );
    else throw Error("Invalid props for component 'Button'");
}

export default Button;
