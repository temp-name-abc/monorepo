import { useState } from "react";
import { ArrowBack, ArrowForward, X } from "tabler-icons-react";
import { useTutorial } from "hooks";
import { TutorialSlide } from "./TutorialSlide";
import { Button } from "../Button";
import { Modal } from "../Modal";
import StartTrial from "../StartTrial";

interface IProps {}

export function Tutorial({}: IProps) {
    const { isActive, completeTutorial } = useTutorial();
    const [position, setPosition] = useState<number>(0);

    const slides = [
        <TutorialSlide
            title="Welcome, to MonoStack!"
            descriptions={[
                "Welcome to MonoStack, the number one platform powering natural language conversations with your data!",
                <>
                    When you're ready, press <span className="font-medium">Next</span> to get started.
                </>,
            ]}
        />,
        <TutorialSlide
            title="Step 1, upload your documents!"
            descriptions={[
                "For the AI to answer questions using your notes, you need to upload them first!",
                <>
                    Navigate to <span className="font-medium">Storage</span>, create a new collection, then navigate to that collection and upload your documents.
                </>,
            ]}
        />,
        <TutorialSlide
            title="Step 2, start a conversation!"
            descriptions={[
                "Now that you've created a collection and uploaded your documents, it's time to start a conversation!",
                <>
                    Navigate to <span className="font-medium">Chat</span>, create a new conversation, choose your collection, then ask away!
                </>,
            ]}
        />,
        <TutorialSlide
            title="You're all set!"
            descriptions={[
                "Congratulations on taking the first step towards unlocking the full potential of our platform!",
                <>
                    To get started, <span className="font-medium">sign in</span> below!
                </>,
            ]}
        />,
    ];

    const isFirstSlide = position === 0;
    const isLastSlide = position === slides.length - 1;

    const buttons = [];
    if (!isFirstSlide)
        buttons.push(
            <Button type="button" variant="dull" onClick={() => setPosition((pos) => pos - 1)} icon={<ArrowBack />}>
                Back
            </Button>
        );
    if (isLastSlide) buttons.push(<StartTrial />);
    else
        buttons.push(
            <Button type="button" variant="accent" onClick={() => setPosition((pos) => pos + 1)} icon={<ArrowForward />}>
                Next
            </Button>
        );

    return (
        <Modal title="Getting Started" isActive={isActive} setIsActive={isLastSlide ? () => completeTutorial() : undefined}>
            <></>
            <div className="pb-6">{slides[position]}</div>
            <div className={`flex items-center ${buttons.length > 1 ? "justify-between" : "justify-end"}`}>
                {buttons.map((btn, i) => (
                    <div key={i}>{btn}</div>
                ))}
            </div>
        </Modal>
    );
}

export default Tutorial;
