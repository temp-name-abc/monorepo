import { IChat } from "types";
import { Context } from "./Context";

interface IProps {
    chat: IChat;
}

export function ChatContext({ chat }: IProps) {
    return (
        <div className="flex flex-col space-y-12">
            <header className="space-y-3">
                <h3 className="text-gray-900 font-bold text-xl">{`Chat / Context / ${chat.chatId}`}</h3>
                <p className="font-medium text-gray-600">View the context provided to the AI which was used to generate the chat.</p>
            </header>
            <div className="flex flex-col space-y-8">
                {chat.context.map((context, i) => (
                    <Context key={i} context={context} />
                ))}
            </div>
        </div>
    );
}

export default ChatContext;
