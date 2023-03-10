import { Subscription } from "../../Subscription";
import { Menu2, X } from "tabler-icons-react";
import { Dispatch, SetStateAction } from "react";
import { SignIn } from "../../SignIn";

interface IProps {
    showSideNav: boolean;
    setShowSideNav: Dispatch<SetStateAction<boolean>>;
}

export function NavSmall({ showSideNav, setShowSideNav }: IProps) {
    return (
        <nav className="bg-white px-10 py-5 flex lg:hidden items-center justify-between border-b-2 border-gray-200">
            <button className="text-gray-900" onClick={() => setShowSideNav((prev) => !prev)}>
                {showSideNav ? <X /> : <Menu2 />}
            </button>
            <div className="flex items-center justify-between space-x-8">
                <Subscription />
                <SignIn />
            </div>
        </nav>
    );
}

export default NavSmall;
