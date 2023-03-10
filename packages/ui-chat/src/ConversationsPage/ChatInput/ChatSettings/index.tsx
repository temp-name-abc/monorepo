import { Dispatch, SetStateAction } from "react";
import { IChatData } from "types";
import { Slider } from "ui";

interface IProps {
    chatData: IChatData;
    setChatData: Dispatch<SetStateAction<IChatData>>;
}

export function ChatSettings({ chatData, setChatData }: IProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-gray-900 font-bold">Advanced Chat Settings</h3>
            <form className="space-y-6">
                <Slider
                    title="Max Documents"
                    description="The maximum amount of context chunks to retrieve."
                    step={1}
                    min={0}
                    max={10}
                    defaultValue={chatData.maxDocuments}
                    onChange={(value) => setChatData((prev) => ({ ...prev, maxDocuments: value }))}
                />
                <Slider
                    title="Max Response Characters"
                    description="The maximum amount of characters in a chat response."
                    step={1}
                    min={0}
                    max={10000}
                    defaultValue={chatData.maxCharOut}
                    onChange={(value) => setChatData((prev) => ({ ...prev, maxCharOut: value }))}
                />
                <Slider
                    title="Minimum Threshold"
                    description="The minimum similarity value of a document required for it to be shown."
                    step={0.1}
                    min={0}
                    max={1}
                    defaultValue={chatData.minThreshold}
                    onChange={(value) => setChatData((prev) => ({ ...prev, minThreshold: value }))}
                />
                <Slider
                    title="Extend Down"
                    description="The amount of chunks down to extend a returned document chunk."
                    step={1}
                    min={0}
                    max={10}
                    defaultValue={chatData.extendDown}
                    onChange={(value) => setChatData((prev) => ({ ...prev, extendDown: value }))}
                />
                <Slider
                    title="Extend Up"
                    description="The amount of chunks up to extend a returned document chunk."
                    step={1}
                    min={0}
                    max={10}
                    defaultValue={chatData.extendUp}
                    onChange={(value) => setChatData((prev) => ({ ...prev, extendUp: value }))}
                />
            </form>
        </div>
    );
}

export default ChatSettings;
