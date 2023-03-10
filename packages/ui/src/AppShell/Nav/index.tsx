import { useSession } from "next-auth/react";
import { Subscription } from "../../Subscription";
import { SignIn } from "../../SignIn";
import { Logo } from "../Logo";

interface IProps {}

export function Nav({}: IProps) {
    const session = useSession();

    return (
        <nav className="bg-white px-10 py-5 hidden lg:flex items-center justify-between border-b-2 border-gray-200">
            <Logo />
            <div className="flex items-center justify-between space-x-8">
                {session.data && (
                    <p className="text-gray-800">
                        Welcome, <span className="font-medium">{session.data.user?.email?.split("@")[0].slice(0, 4)}...</span>
                    </p>
                )}
                <Subscription />
                <SignIn />
            </div>
        </nav>
    );
}

export default Nav;
