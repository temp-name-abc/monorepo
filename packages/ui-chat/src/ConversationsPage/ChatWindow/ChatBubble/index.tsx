import { TextChunk } from "ui";

interface IProps {
    children: string;
    style: "accent" | "dull";
    onClick?: () => void;
}

export function ChatBubble({ children, style, onClick }: IProps) {
    const styleAccent = "px-8 py-4 text-white bg-sky-500 font-medium text-sm";
    const styleDull = "px-8 py-4 text-gray-600 bg-white font-medium text-sm cursor-pointer";

    return (
        <div onClick={onClick} className={style === "accent" ? styleAccent : styleDull}>
            <TextChunk text={children} />
        </div>
    );
}

export default ChatBubble;
