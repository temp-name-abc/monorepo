import { Subscriptions, SubAppShell } from "ui";
import { links } from "../links";

interface IProps {}

export function BillingPage({}: IProps) {
    return (
        <SubAppShell title="Chat / Billing" description="Subscribe and manage your subscriptions for the billing service." links={links}>
            <Subscriptions products={["chat.conversation.chat"]} />
        </SubAppShell>
    );
}

export default BillingPage;
