import { BrandFacebook, Bucket, Lock, Message2 } from "tabler-icons-react";
import { FACEBOOK_URL, PRIVACY_POLICY_URL } from "utils";
import { Button } from "../../Button";

interface IProps {}

export function SideNavSmall({}: IProps) {
    return (
        <nav className="lg:hidden flex justify-between space-x-10 bg-gray-50 py-5 px-10">
            <div className="flex flex-col space-y-5 w-full">
                <h3 className="font-bold text-gray-600 text-sm">Navigation</h3>
                <Button variant="dull" type="link" href="/storage/collections" icon={<Bucket />} thick={true}>
                    Storage
                </Button>
                <Button variant="dull" type="link" href="/chat/conversations" icon={<Message2 />} thick={true}>
                    Chat
                </Button>
            </div>
            <div className="flex flex-col space-y-5 w-full">
                <h3 className="font-bold text-gray-600 text-sm">External</h3>
                <Button variant="dull" type="link" href={PRIVACY_POLICY_URL} icon={<Lock />} newTab={true} thick={true}>
                    Privacy
                </Button>
                <Button variant="dull" type="link" href={FACEBOOK_URL} icon={<BrandFacebook />} newTab={true} thick={true}>
                    Facebook
                </Button>
            </div>
        </nav>
    );
}

export default SideNavSmall;
