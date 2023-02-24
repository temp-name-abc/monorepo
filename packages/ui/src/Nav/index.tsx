import { useSession, signIn, signOut } from "next-auth/react";

interface IProps {}

export function Nav({}: IProps) {
    const session = useSession();

    return (
        <nav className="bg-white px-10 py-5 flex items-center justify-between">
            <h1 className="font-bold text-gray-900">MONO</h1>
            {session.data ? (
                <div className="flex items-center justify-between space-x-5">
                    <p className="text-gray-800">
                        Welcome, <span className="font-medium">{session.data.user?.email?.split("@")[0]}</span>
                    </p>
                    <button className="font-medium text-gray-400 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl" onClick={() => signOut()}>
                        Sign Out
                    </button>
                </div>
            ) : (
                <button className="font-medium text-gray-400 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl" onClick={() => signIn()}>
                    Sign In
                </button>
            )}
        </nav>
    );
}

export default Nav;
