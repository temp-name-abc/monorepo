import { IConversation } from "types";
import { Button } from "ui";

interface IProps {
    conversation: IConversation;
}

export function Conversation({ conversation }: IProps) {
    return (
        <Button type="button" variant="dull" thick={true}>
            {conversation.name}
        </Button>
    );
}

export default Conversation;
