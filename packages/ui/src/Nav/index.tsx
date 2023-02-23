import { useSession, signIn, signOut } from "next-auth/react";

interface IProps {}

export function Nav({}: IProps) {
    const { data } = useSession();

    return (
        <nav>
            <h1>App</h1>
            {data ? (
                <>
                    <button onClick={() => signOut()}>Sign Out</button>
                    <p>Welcome, {data.user?.email?.split("@")[0]}</p>
                </>
            ) : (
                <button onClick={() => signIn()}>Sign In</button>
            )}
        </nav>
    );
}

export default Nav;
