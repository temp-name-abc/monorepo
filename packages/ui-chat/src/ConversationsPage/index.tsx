import { SubAppShell } from "ui/src/SubAppShell";
import { links } from "../links";

interface IProps {}

export function ConversationsPage({}: IProps) {
    return (
        <SubAppShell title="Chat / Conversations" description="View all your conversations." links={links}>
            <div className="flex flex-col space-y-12">
                {/* <div className="ml-auto">
                    <TextCreate onClick={(name) => token && mutation.mutate({ token, name })} />
                </div> */}
                {/* <Collections collections={data} /> */}
            </div>
        </SubAppShell>
    );
}

export default ConversationsPage;
