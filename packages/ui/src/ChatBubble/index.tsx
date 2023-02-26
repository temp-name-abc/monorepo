interface IProps {
    children: any;
    style: "left" | "right" | "leftnobubble" | "centernobubble" | "rightnobubble";
}

export function ChatBubble({ children, style }: IProps) {
    const styleLeft = "mr-auto px-8 py-4 text-gray-600 bg-white font-medium w-auto text-left text-sm";
    const styleRight = "ml-auto px-8 py-4 text-white bg-violet-600 font-medium w-auto text-right text-sm";

    const styleNoBubble = "px-8 py-4 font-medium text-gray-400 w-auto text-sm";

    const styleLeftNoBubble = `mr-auto text-left ${styleNoBubble}`;
    const styleCenterNoBubble = `mx-auto text-center ${styleNoBubble}`;
    const styleRightNoBubble = `ml-auto text-right ${styleNoBubble}`;

    const mapping = {
        left: styleLeft,
        right: styleRight,
        leftnobubble: styleLeftNoBubble,
        centernobubble: styleCenterNoBubble,
        rightnobubble: styleRightNoBubble,
    };

    return (
        <p className={mapping[style]} style={{ maxWidth: "50%" }}>
            {children}
        </p>
    );
}

export default ChatBubble;
