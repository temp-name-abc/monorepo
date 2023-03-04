import { useEffect, useState } from "react";
import { X } from "tabler-icons-react";

interface IProps {
    children: any;
}

export function TutorialProvider({ children }: IProps) {
    const [enabled, setEnabled] = useState<boolean>(true);

    // **** We need to add the billing information in here e.g. get started by subscribing
    // **** When the user finishes subscribing, it will set a done flag on their local storage (or if they press X it will do the same thing)
    // **** Users should be able to navigate between different slides
    // **** For each of the slides, we will be able to navigate between them using a back and forward slider (except for the last one)

    useEffect(() => {
        // **** First we check local storage, and if there has been nothing mentioned we will put it there

        console.log("Hello world");
    }, []);

    return (
        <>
            {enabled && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 opacity-50" />
                        <div className="relative z-10 w-full max-w-md mx-auto my-auto bg-white shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-gray-900 font-bold">Tutorial</h3>
                                <button className="text-gray-900 font-bold">
                                    <X />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {children}
        </>
    );
}

export default TutorialProvider;
