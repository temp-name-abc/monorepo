import { BrandFacebook, Bucket, Lock, Message2 } from "tabler-icons-react";
import { ILink } from "types";
import { FACEBOOK_URL, PRIVACY_POLICY_URL } from "utils";
import { Button } from "../../Button";

interface IProps {
    navigationLinks: ILink[];
    externalLinks: ILink[];
}

export function SideNav({ navigationLinks, externalLinks }: IProps) {
    return (
        <nav className="h-screen flex-col bg-gray-50 py-5 px-10 space-y-10 hidden lg:flex">
            <div className="flex flex-col space-y-5">
                <h3 className="font-bold text-gray-600 text-sm">Navigation</h3>
                {navigationLinks.map((link, i) => (
                    <Button key={i} variant="dull" type="link" href={link.href} icon={link.icon} thick={true}>
                        {link.children}
                    </Button>
                ))}
            </div>
            <div className="flex flex-col space-y-5">
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

export default SideNav;
