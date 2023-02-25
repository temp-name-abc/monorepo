import Link from "next/link";

interface IProps {
    children: any;
    type: "button" | "link";
    variant: "dull" | "accent";
    onClick?: (e: any) => any;
    href?: string;
}

export function Button({ children, type, variant, onClick, href }: IProps) {
    const color = variant === "dull" ? "text-gray-400 bg-gray-100 hover:bg-gray-200" : "text-gray-50 bg-violet-600 hover:bg-violet-700";

    const style = `font-medium px-4 py-2 ${color}`;

    if (type === "button")
        return (
            <button className={style} onClick={onClick}>
                {children}
            </button>
        );
    else if (type === "link" && !!href)
        return (
            <Link className={style} onClick={onClick} href={href}>
                {children}
            </Link>
        );
    else throw Error("Invalid props for element Button");
}

export default Button;
