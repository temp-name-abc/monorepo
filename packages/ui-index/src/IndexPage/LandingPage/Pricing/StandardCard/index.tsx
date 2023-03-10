import { Coin } from "tabler-icons-react";
import CardSection from "../CardSection";

interface IProps {}

export function StandardCard({}: IProps) {
    return (
        <div className="flex flex-col items-center bg-gray-100 w-full">
            <div className="text-gray-800 flex flex-col items-center bg-gray-200 w-full p-8 space-y-2">
                <Coin size={48} />
                <h3 className="font-medium">Standard</h3>
                <p className="text-lg font-bold text-gray-900">Pay As You Go</p>
                <p className="text-gray-900">Only pay for what you use, when you use it.</p>
            </div>
            <div className="flex flex-col w-full p-8 space-y-4">
                <CardSection title="Storage" pricing={[{ heading: "Documents uploaded:", price: "$0.0001 AUD / 1k characters" }]} />
                <CardSection
                    title="Chat"
                    pricing={[
                        { heading: "Messages sent:", price: "$0.0005 AUD / 1k characters" },
                        { heading: "Messages received:", price: "$0.0005 AUD / 1k characters" },
                        { heading: "Contexts retrieved:", price: "$0.00075 AUD / context chunk" },
                    ]}
                />
            </div>
        </div>
    );
}

export default StandardCard;
