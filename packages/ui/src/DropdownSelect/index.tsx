import { useEffect, useState } from "react";

interface IProps {
    options: [string, string][];
    onChange: (value: string) => void;
}

export function DropdownSelect({ options, onChange }: IProps) {
    const [selected, setSelected] = useState<string>("");

    useEffect(() => {
        onChange(selected);
    }, [selected]);

    return (
        <select className="outline-none bg-gray-100 px-4 py-2 text-gray-400 w-full" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Choose a collection</option>
            {options.map((option, i) => (
                <option key={i} value={option[0]}>
                    {option[1]}
                </option>
            ))}
        </select>
    );
}

export default DropdownSelect;
