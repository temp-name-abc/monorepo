import CustomCard from "./CustomCard";
import { StandardCard } from "./StandardCard";

interface IProps {}

export function Plans({}: IProps) {
    return (
        <div className="p-16 w-full space-y-16">
            <h2 className="text-3xl font-extrabold text-gray-900">Plans</h2>
            <div className="flex justify-evenly space-x-16 w-4/5 mx-auto">
                <StandardCard />
                <CustomCard />
            </div>
        </div>
    );
}

export default Plans;
