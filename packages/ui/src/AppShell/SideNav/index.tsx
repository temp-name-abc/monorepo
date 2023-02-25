import { Bucket, FileSearch } from "tabler-icons-react";
import { Button } from "../../Button";

interface IProps {}

export function SideNav({}: IProps) {
    return (
        <div className="flex h-screen">
            <div className="bg-gray-50 w-64 py-5 px-10">
                <div className="flex flex-col space-y-5">
                    <Button variant="dull" type="link" href="#" icon={<Bucket />}>
                        Storage
                    </Button>
                    <Button variant="dull" type="link" href="#" icon={<FileSearch />}>
                        Search
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default SideNav;
