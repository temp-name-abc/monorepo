import { SubAppShell } from "ui";
import { links } from "../links";

interface IProps {}

export function BillingPage({}: IProps) {
    return (
        <SubAppShell title="Billing" description="Subscribe and manage your subscriptions to our various services." links={links}>
            <div className="flex flex-col space-y-12"></div>
        </SubAppShell>
    );
}

export default BillingPage;
