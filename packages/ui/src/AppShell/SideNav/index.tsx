import { Bucket, Message2 } from "tabler-icons-react";
import { Button } from "../../Button";

interface IProps {}

export function SideNav({}: IProps) {
    return (
        <nav className="flex h-screen">
            <div className="bg-gray-50 w-64 py-5 px-10">
                <div className="flex flex-col space-y-5">
                    <Button variant="dull" type="link" href="/storage/collections" icon={<Bucket />} thick={true}>
                        Storage
                    </Button>
                    <Button variant="dull" type="link" href="/chat/conversations" icon={<Message2 />} thick={true}>
                        Chat
                    </Button>
                </div>
            </div>
        </nav>
    );
}

export default SideNav;
