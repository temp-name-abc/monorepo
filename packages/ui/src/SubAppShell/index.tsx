import { ReactNode } from "react";
import Button from "../Button";

interface IProps {
    children: any;
    title: string;
    description: string;
    links: {
        href: string;
        children: any;
        icon: ReactNode;
    }[];
}

export function SubAppShell({ children, title, description, links }: IProps) {
    return (
        <div className="p-10 space-y-10">
            <nav className="flex space-x-8">
                {links.map((link, i) => (
                    <Button key={i} type="link" variant="dull" href={link.href} icon={link.icon}>
                        {link.children}
                    </Button>
                ))}
            </nav>
            <main className="flex flex-col space-y-12">
                <header className="space-y-3">
                    <h2 className="text-gray-900 font-bold text-xl">{title}</h2>
                    <p className="font-medium text-gray-600">{description}</p>
                </header>
                {children}
            </main>
        </div>
    );
}

export default SubAppShell;
