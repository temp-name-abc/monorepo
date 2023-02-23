import { useSession, signIn, signOut } from "next-auth/react";

export default function Web() {
    const { data: session } = useSession();

    return (
        <div>
            <h1>Web</h1>
            <p>{JSON.stringify(session)}</p>
            <button onClick={() => signIn()}>Sign In</button>
            <button onClick={() => signOut()}>Sign Out</button>
        </div>
    );
}
