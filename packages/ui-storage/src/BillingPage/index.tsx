import { SubAppShell } from "ui/src/SubAppShell";
import Subscriptions from "ui/src/Subscriptions";
import { links } from "../links";

interface IProps {}

export function BillingPage({}: IProps) {
    return (
        <SubAppShell title="Storage / Billing" description="Subscribe and manage your subscriptions for the storage service." links={links}>
            <Subscriptions products={["storage.document.process.text"]} />
        </SubAppShell>
    );
}

export default BillingPage;
