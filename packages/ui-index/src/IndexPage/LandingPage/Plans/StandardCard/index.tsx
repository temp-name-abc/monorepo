import { CreditCard } from "tabler-icons-react";
import { StartTrial } from "ui";
import { CardSection } from "../CardSection";

interface IProps {}

export function StandardCard({}: IProps) {
    return (
        <div className="flex flex-col items-center bg-gray-100 w-full">
            <div className="text-gray-100 flex flex-col items-center bg-violet-600 w-full p-8 space-y-2">
                <h3 className="font-medium text-sm mb-6">Pay As You Go</h3>
                <CreditCard size={48} />
                <p className="text-xl font-bold text-gray-50">Standard</p>
                <p className="text-gray-300">Only pay for what you use, when you use it.</p>
            </div>
            <div className="flex flex-col w-full p-8 space-y-4">
                <h3 className="font-bold text-lg text-gray-900">Pricing</h3>
                <CardSection title="Storage" pricing={[{ heading: "Documents uploaded:", price: "$0.0001 AUD / 1,000 characters" }]} />
                <CardSection
                    title="Chat"
                    pricing={[
                        { heading: "Chats sent:", price: "$0.0005 AUD / 1,000 characters" },
                        { heading: "Chats received:", price: "$0.0005 AUD / 1,000 characters" },
                        { heading: "Contexts retrieved:", price: "$0.00075 AUD / context chunk" },
                    ]}
                />
            </div>
            <div className="p-8">
                <StartTrial />
            </div>
        </div>
    );
}

export default StandardCard;
