import { useSession, signIn, signOut } from "next-auth/react";
import { Login, Logout } from "tabler-icons-react";
import { Button } from "../Button";

interface IProps {}

export function SignIn({}: IProps) {
    const session = useSession();

    if (!session.data)
        return (
            <Button type="button" variant="accent" icon={<Login />} onClick={() => signIn(undefined, { callbackUrl: `/?status=LOGGED_IN` })}>
                Sign In
            </Button>
        );

    return (
        <Button type="button" variant="dull" icon={<Logout />} onClick={() => signOut()}>
            Sign Out
        </Button>
    );
}

export default SignIn;
