import { useQuery } from "@tanstack/react-query";
import { getPortal } from "helpers";
import { useSession } from "next-auth/react";
import { CreditCard } from "tabler-icons-react";
import { KEY_PORTAL, products } from "utils";
import { Button } from "../Button";

interface IProps {}

export function Subscription({}: IProps) {
    const session = useSession();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data } = useQuery([KEY_PORTAL], () => getPortal(token as string, products), {
        enabled: !!token,
    });

    if (!data) return null;

    return (
        <Button type="link" variant={data.active ? "dull" : "accent"} icon={<CreditCard />} href={data.url}>
            {data.active ? "Manage" : "Subscribe"}
        </Button>
    );
}

export default Subscription;
