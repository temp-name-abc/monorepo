import { useSession, signIn, signOut } from "next-auth/react";
import { getToken } from "next-auth/jwt";

interface IProps {}

export function Nav({}: IProps) {
    const session = useSession();

    return (
        <nav>
            <h1 className="font-bold text-blue-100">App</h1>
            {session.data ? (
                <>
                    <button onClick={() => signOut()}>Sign Out</button>
                    <p>Welcome, {session.data.user?.email?.split("@")[0]}</p>
                </>
            ) : (
                <button onClick={() => signIn()}>Sign In</button>
            )}
        </nav>
    );
}

export default Nav;
