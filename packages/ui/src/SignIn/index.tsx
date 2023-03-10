import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "../Button";

interface IProps {}

export function SignIn({}: IProps) {
    const session = useSession();

    if (!session.data)
        return (
            <Button type="button" variant="accent" onClick={() => signIn(undefined, { callbackUrl: `/?status=LOGGED_IN` })}>
                Sign In
            </Button>
        );

    return (
        <Button type="button" variant="dull" onClick={() => signOut()}>
            Sign Out
        </Button>
    );
}

export default SignIn;
