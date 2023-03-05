import { ILink } from "types";
import { Button } from "../../Button";

interface IProps {
    navigationLinks: ILink[];
    externalLinks: ILink[];
}

export function SideNavSmall({ navigationLinks, externalLinks }: IProps) {
    return (
        <nav className="lg:hidden flex justify-between space-x-10 bg-gray-50 py-5 px-10">
            <div className="flex flex-col space-y-5 w-full">
                <h3 className="font-bold text-gray-600 text-sm">Navigation</h3>
                {navigationLinks.map((link, i) => (
                    <Button key={i} variant="dull" type="link" href={link.href} icon={link.icon} thick={true}>
                        {link.children}
                    </Button>
                ))}
            </div>
            <div className="flex flex-col space-y-5 w-full">
                <h3 className="font-bold text-gray-600 text-sm">External</h3>
                {externalLinks.map((link, i) => (
                    <Button key={i} variant="dull" type="link" href={link.href} icon={link.icon} thick={true}>
                        {link.children}
                    </Button>
                ))}
            </div>
        </nav>
    );
}

export default SideNavSmall;
