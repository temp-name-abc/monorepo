import { useState } from "react";

interface IProps {
    onClick: (text: string) => any;
}

export function TextCreate({ onClick }: IProps) {
    const [value, setValue] = useState<string>("");

    return (
        <form
            className="space-x-2"
            onClick={(e) => {
                e.preventDefault();

                if (!value) return;

                onClick(value);
                setValue("");
            }}
        >
            <input
                type="text"
                onChange={(e) => setValue(e.target.value)}
                value={value}
                placeholder="Collection name"
                className="px-4 py-2 text-gray-400 bg-gray-100 focus:bg-gray-200 focus:text-gray-800 outline-none"
            />
            <input type="submit" value="Create" className="cursor-pointer font-medium px-4 py-2 text-gray-50 bg-violet-600 hover:bg-violet-700" />
        </form>
    );
}

export default TextCreate;
