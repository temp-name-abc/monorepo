import { BrandFacebook, Bucket, Lock, Message2 } from "tabler-icons-react";
import { FACEBOOK_URL, PRIVACY_POLICY_URL } from "utils";
import { Button } from "../../Button";

interface IProps {}

export function SideNav({}: IProps) {
    return (
        <nav className="flex h-screen">
            <div className="bg-gray-50 w-64 py-5 px-10 space-y-[576px]">
                <div className="flex flex-col space-y-5">
                    <Button variant="dull" type="link" href="/storage/collections" icon={<Bucket />} thick={true}>
                        Storage
                    </Button>
                    <Button variant="dull" type="link" href="/chat/conversations" icon={<Message2 />} thick={true}>
                        Chat
                    </Button>
                </div>
                <div className="flex flex-col space-y-2">
                    <Button variant="dull" type="link" href={PRIVACY_POLICY_URL} icon={<Lock />} newTab={true}>
                        Privacy
                    </Button>
                    <Button variant="dull" type="link" href={FACEBOOK_URL} icon={<BrandFacebook />} newTab={true}>
                        Facebook
                    </Button>
                </div>
            </div>
        </nav>
    );
}

export default SideNav;
