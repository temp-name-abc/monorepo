import { useSession, signIn, signOut } from "next-auth/client";

export default function Web() {
    const [session, loading] = useSession();

    return (
        <div>
            <h1>Web</h1>
            <p>{JSON.stringify(session)}</p>
            <button onClick={signIn}>Sign In</button>
            <button onClick={signOut}>Sign Out</button>
        </div>
    );
}
