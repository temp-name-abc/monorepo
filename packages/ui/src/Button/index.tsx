import Link from "next/link";
import { ReactNode } from "react";

interface IProps {
    children: any;
    type: "button" | "link";
    variant: "dull" | "accent";
    onClick?: (e: any) => any;
    href?: string;
    icon?: ReactNode;
}

export function Button({ children, type, variant, onClick, href, icon }: IProps) {
    const color = variant === "dull" ? "text-gray-400 bg-gray-100 hover:bg-gray-200" : "text-gray-50 bg-violet-600 hover:bg-violet-700";
    const paddingY = icon ? "py-4" : "py-2";

    const style = `font-medium px-4 ${paddingY} ${color} flex items-center justify-between`;

    if (type === "button")
        return (
            <button className={style} onClick={onClick}>
                {children}
                {icon}
            </button>
        );
    else if (type === "link" && !!href)
        return (
            <Link className={style} onClick={onClick} href={href}>
                {children}
                {icon}
            </Link>
        );
    else throw Error("Invalid props for component 'Button'");
}

export default Button;
