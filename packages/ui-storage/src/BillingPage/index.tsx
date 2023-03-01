import { SubAppShell, Subscriptions } from "ui";
import { links } from "../links";

interface IProps {}

export function BillingPage({}: IProps) {
    return (
        <SubAppShell title="Storage / Billing" description="Subscribe and manage your subscriptions for the storage service." links={links}>
            <Subscriptions products={["storage.collection.document.process"]} />
        </SubAppShell>
    );
}

export default BillingPage;
