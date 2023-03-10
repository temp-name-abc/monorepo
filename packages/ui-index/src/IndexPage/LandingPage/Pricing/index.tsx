import { StandardCard } from "./StandardCard";

interface IProps {}

export function Pricing({}: IProps) {
    return (
        <div className="p-16 w-full space-y-16">
            <h2 className="text-3xl font-extrabold text-gray-900">Pricing</h2>
            <div className="flex justify-evenly space-x-10 ">
                <StandardCard />
                <StandardCard />
            </div>
        </div>
    );
}

export default Pricing;
