import CustomCard from "./CustomCard";
import { StandardCard } from "./StandardCard";

interface IProps {}

export function Plans({}: IProps) {
    return (
        <div className="p-16 w-full space-y-16">
            <h2 className="text-3xl font-extrabold text-gray-900">Plans</h2>
            <div className="flex flex-col xl:flex-row justify-evenly space-y-12 xl:space-y-0 xl:space-x-12 mx-auto">
                <StandardCard />
                <CustomCard />
            </div>
        </div>
    );
}

export default Plans;
