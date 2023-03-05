import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "../../Button";
import { Subscription } from "../../Subscription";
import { Menu2, X } from "tabler-icons-react";
import { Dispatch, SetStateAction } from "react";

interface IProps {
    showSideNav: boolean;
    setShowSideNav: Dispatch<SetStateAction<boolean>>;
}

export function NavSmall({ showSideNav, setShowSideNav }: IProps) {
    const session = useSession();

    return (
        <nav className="bg-white px-10 py-5 flex lg:hidden items-center justify-between border-b-2 border-gray-200">
            <button className="text-gray-900" onClick={() => setShowSideNav((prev) => !prev)}>
                {showSideNav ? <X /> : <Menu2 />}
            </button>
            {session.data ? (
                <div className="flex items-center justify-between space-x-8">
                    <Subscription />
                    <Button type="button" variant="dull" onClick={() => signOut()}>
                        Sign Out
                    </Button>
                </div>
            ) : (
                <Button type="button" variant="accent" onClick={() => signIn()}>
                    Sign In
                </Button>
            )}
        </nav>
    );
}

export default NavSmall;
