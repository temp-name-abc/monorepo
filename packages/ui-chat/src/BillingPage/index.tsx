import { SubAppShell } from "ui/src/SubAppShell";
import Subscriptions from "ui/src/Subscriptions";
import { links } from "../links";

interface IProps {}

export function BillingPage({}: IProps) {
    return (
        <SubAppShell title="Chat / Billing" description="Subscribe and manage your subscriptions for the billing service." links={links}>
            <Subscriptions products={["chat.chat"]} />
        </SubAppShell>
    );
}

export default BillingPage;
