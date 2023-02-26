import { useState } from "react";

interface IProps {
    cta: string;
    placeholder: string;
    onClick: (text: string) => any;
}

export function TextCreate({ cta, placeholder, onClick }: IProps) {
    const [value, setValue] = useState<string>("");

    return (
        <form
            className="space-x-2 flex"
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
                placeholder={placeholder}
                className="w-full px-4 py-2 text-gray-400 bg-gray-100 focus:bg-gray-200 focus:text-gray-800 outline-none"
            />
            <input type="submit" value={cta} className="cursor-pointer font-medium px-4 py-2 text-gray-50 bg-violet-600 hover:bg-violet-700" />
        </form>
    );
}

export default TextCreate;
