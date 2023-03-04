import { useState } from "react";
import { ArrowBack, ArrowForward, X } from "tabler-icons-react";
import { useTutorial } from "hooks";
import { TutorialSlide } from "./TutorialSlide";
import { Button, Subscription } from "ui";

interface IProps {
    children: any;
}

export function Tutorial({ children }: IProps) {
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
                    Our flexible payment model means you only pay for what you use. Simply <span className="font-medium">add your card</span> and start having
                    conversations using your data today!
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
    if (isLastSlide) buttons.push(<Subscription />);
    else
        buttons.push(
            <Button type="button" variant="accent" onClick={() => setPosition((pos) => pos + 1)} icon={<ArrowForward />}>
                Next
            </Button>
        );

    return (
        <>
            {isActive && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 opacity-50" />
                        <div className="relative z-10 w-full max-w-lg bg-white shadow-lg p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-gray-900 font-bold">Tutorial</h3>
                                {isLastSlide && (
                                    <button className="text-gray-900 font-bold" onClick={completeTutorial}>
                                        <X />
                                    </button>
                                )}
                            </div>
                            <div className="pb-6">{slides[position]}</div>
                            <div className={`flex items-center ${buttons.length > 1 ? "justify-between" : "justify-end"}`}>
                                {buttons.map((btn, i) => (
                                    <div key={i}>{btn}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {children}
        </>
    );
}

export default Tutorial;
