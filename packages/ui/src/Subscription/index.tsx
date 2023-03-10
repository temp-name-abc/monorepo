import { useQuery } from "@tanstack/react-query";
import { getPortal } from "helpers";
import { useSession } from "next-auth/react";
import { Coin, CreditCard, CreditCardOff } from "tabler-icons-react";
import { KEY_PORTAL } from "utils";
import { Button } from "../Button";

interface IProps {}

export function Subscription({}: IProps) {
    const session = useSession();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data } = useQuery([KEY_PORTAL], () => getPortal(token as string), {
        enabled: !!token,
    });

    if (!data) return null;

    if (data.status === "CARD" || data.status === "TRIALING_CARD")
        return (
            <Button type="link" variant="dull" icon={<Coin />} href={data.url}>
                Manage
            </Button>
        );
    else if (data.status === "SANDBOX") return null;
    else if (data.status === "NOT_SUBSCRIBED")
        return (
            <Button type="link" variant="accent" icon={<CreditCardOff />} href={data.url}>
                Free Trial
            </Button>
        );
    else if (data.status === "TRIALING_NO_CARD")
        return (
            <Button type="link" variant="accent" icon={<CreditCard />} href={data.url}>
                Add Payment
            </Button>
        );
    else
        return (
            <Button type="link" variant="accent" icon={<CreditCard />} href={data.url}>
                Subscribe
            </Button>
        );
}

export default Subscription;
