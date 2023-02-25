import { ReactNode } from "react";
import Button from "../Button";

interface IProps {
    children: any;
    links: {
        href: string;
        children: any;
        icon: ReactNode;
    }[];
}

export function SubAppShell({ children, links }: IProps) {
    return (
        <div className="p-10 space-y-10">
            <nav className="flex items-center space-x-8">
                {links.map((link, i) => (
                    <Button key={i} type="link" variant="dull" href={link.href} icon={link.icon}>
                        {link.children}
                    </Button>
                ))}
            </nav>
            <main>{children}</main>
        </div>
    );
}

export default SubAppShell;
