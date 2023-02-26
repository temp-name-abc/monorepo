import { ChatBubble } from "ui";

interface IProps {
    user: any;
    other?: any;
}

export function Chat({ user, other }: IProps) {
    return (
        <div className="flex flex-col space-y-8">
            <ChatBubble style="right">{user}</ChatBubble>
            <ChatBubble style={other ? "left" : "leftnobubble"}>{other ? other : "Typing..."}</ChatBubble>
        </div>
    );
}

export default Chat;
