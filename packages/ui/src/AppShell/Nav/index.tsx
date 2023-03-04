import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "../../Button";
import { Subscription } from "../../Subscription";

interface IProps {}

export function Nav({}: IProps) {
    const session = useSession();

    return (
        <nav className="bg-white px-10 py-5 flex items-center justify-between border-b-2 border-gray-200">
            <Link href="/">
                <h1 className="font-bold text-lg">
                    <span className="text-gray-900">MONO</span>
                    <span className="text-violet-600">STACK</span>
                </h1>
            </Link>
            {session.data ? (
                <div className="flex items-center justify-between space-x-8">
                    <p className="text-gray-800">
                        Welcome, <span className="font-medium">{session.data.user?.email?.split("@")[0].slice(0, 4)}...</span>
                    </p>
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

export default Nav;
