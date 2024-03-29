import Head from "next/head";
import { ILink } from "types";
import { Button } from "../Button";

interface IProps {
    children: any;
    title: string;
    description: string;
    links: ILink[];
}

export function SubAppShell({ children, title, description, links }: IProps) {
    return (
        <>
            <Head>
                <title>{`${title} - MonoStack`}</title>
                <meta name="description" content={description} />
                <link rel="shortcut icon" href="/images/favicon.ico" />
            </Head>
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
        </>
    );
}

export default SubAppShell;
