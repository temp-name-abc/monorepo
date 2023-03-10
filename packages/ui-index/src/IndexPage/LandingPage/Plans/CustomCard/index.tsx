import { Mail, Puzzle } from "tabler-icons-react";
import { Button } from "ui";
import { CardSection } from "../CardSection";

interface IProps {}

export function CustomCard({}: IProps) {
    return (
        <div className="flex flex-col items-center bg-gray-50 w-full">
            <div className="text-gray-800 flex flex-col items-center bg-gray-100 w-full p-8 space-y-2">
                <h3 className="font-medium text-sm mb-6">Pay As You Go</h3>
                <Puzzle size={48} />
                <p className="text-xl font-bold text-gray-900">Custom</p>
                <p className="text-gray-600">Custom pricing tailored to your business.</p>
            </div>
            <div className="flex flex-col w-full p-8 space-y-4">
                <h3 className="font-bold text-lg text-gray-900">Pricing</h3>
                <CardSection title="Storage" pricing={[{ heading: "Documents uploaded:", price: "custom" }]} />
                <CardSection
                    title="Chat"
                    pricing={[
                        { heading: "Messages sent:", price: "custom" },
                        { heading: "Messages received:", price: "custom" },
                        { heading: "Contexts retrieved:", price: "custom" },
                    ]}
                />
            </div>
            <div className="p-8 text-center">
                <p className="text-violet-600 font-medium">Contact Us</p>
                <p className="text-gray-900 text-lg font-bold">sales@monostack.app</p>
            </div>
        </div>
    );
}

export default CustomCard;
