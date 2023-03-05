import { useEffect, useState } from "react";

interface IProps {
    options: [string, string][];
    placeholder: string;
    onChange: (value: string) => void;
    selected?: string;
}

export function DropdownSelect({ options, placeholder, onChange, selected: _selected }: IProps) {
    const [selected, setSelected] = useState<string>("");

    useEffect(() => {
        onChange(selected);
    }, [selected]);

    useEffect(() => {
        setSelected(_selected && options.filter((opt) => opt[0] === _selected).length > 0 ? _selected : "");
    }, [_selected, setSelected]);

    return (
        <select className="outline-none bg-gray-200 px-4 py-2 text-gray-400 w-full cursor-pointer" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">{placeholder}</option>
            {options.map((option, i) => (
                <option key={i} value={option[0]}>
                    {option[1]}
                </option>
            ))}
        </select>
    );
}

export default DropdownSelect;
