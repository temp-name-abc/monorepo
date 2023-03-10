import { useState } from "react";

interface IProps {
    title: string;
    description: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    onChange: (value: number) => void;
}

export function Slider({ title, description, min, max, step, defaultValue, onChange }: IProps) {
    const [value, setValue] = useState(defaultValue);

    return (
        <div className="space-y-2">
            <div className="space-y-1">
                <p className="text-gray-800 font-medium">
                    {title} = {value}
                </p>
                <p className="text-gray-600">{description}</p>
            </div>
            <div className="flex items-center justify-evenly space-x-5">
                <span className="font-bold text-gray-600">{min}</span>
                <input
                    className="w-full rounded-md bg-gray-300 accent-gray-600 appearance-none focus:outline-none"
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => {
                        const newValue = e.target.valueAsNumber;
                        setValue(newValue);
                        onChange(newValue);
                    }}
                />
                <span className="font-bold text-gray-600">{max}</span>
            </div>
        </div>
    );
}

export default Slider;
