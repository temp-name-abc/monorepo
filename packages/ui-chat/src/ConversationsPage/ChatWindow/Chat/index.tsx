import { IChat } from "types";

interface IProps {
    chat: IChat;
}

export function Chat({ chat }: IProps) {
    return (
        <div className="flex flex-col space-y-8">
            <div className="ml-auto px-8 py-4 text-gray-600 bg-white font-medium cursor-pointer w-auto text-right text-sm" style={{ maxWidth: "50%" }}>
                {chat.history[0].human}
            </div>
            <div className="mr-auto px-8 py-4 text-white bg-blue-600 font-medium cursor-pointer w-auto text-sm" style={{ maxWidth: "50%" }}>
                {chat.history[0].ai}
            </div>
        </div>
    );
}

export default Chat;
