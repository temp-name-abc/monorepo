import { useQuery } from "@tanstack/react-query";
import { getPortal } from "helpers";
import { signIn, useSession } from "next-auth/react";
import { Coin, CreditCard, CreditCardOff } from "tabler-icons-react";
import { KEY_PORTAL } from "utils";
import { Button } from "../Button";

interface IProps {}

export function StartTrial({}: IProps) {
    const session = useSession();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data } = useQuery([KEY_PORTAL], () => getPortal(token as string), {
        enabled: !!token,
    });

    if (!data)
        return (
            <Button type="button" variant="accent" icon={<CreditCardOff />} onClick={() => signIn(undefined, { callbackUrl: `/?status=LOGGED_IN` })} thick={true}>
                Start Trial
            </Button>
        );

    if (data.active)
        return (
            <Button type="link" variant="dull" icon={<Coin />} href={data.url} thick={true}>
                Manage
            </Button>
        );

    if (data.status === "NOT_SUBSCRIBED_TRIAL_ENDED")
        return (
            <Button type="link" variant="accent" icon={<CreditCard />} href={data.url} thick={true}>
                Subscribe
            </Button>
        );

    return (
        <Button type="link" variant="accent" icon={<CreditCardOff />} href={data.url} thick={true}>
            Start Trial
        </Button>
    );
}

export default StartTrial;
