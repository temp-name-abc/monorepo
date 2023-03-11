import { useState } from "react";

interface IProps {
    cta: string;
    placeholder: string;
    onClick: (text: string) => any;
    disabled?: boolean;
    textArea?: boolean;
}

export function TextCreate({ cta, placeholder, onClick, disabled, textArea }: IProps) {
    const [value, setValue] = useState<string>("");

    const onSubmit = (e: any) => {
        e.preventDefault();

        if (!value) return;

        onClick(value);
        setValue("");
    };

    return (
        <form className="space-x-2 flex items-start w-full" onSubmit={onSubmit}>
            {!textArea ? (
                <input
                    type="text"
                    onChange={(e) => setValue(e.target.value)}
                    value={value}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="w-full px-4 py-2 text-gray-400 bg-gray-100 focus:bg-gray-200 focus:text-gray-800 outline-none"
                />
            ) : (
                <textarea
                    className="w-full px-4 py-2 text-gray-400 bg-gray-100 focus:bg-gray-200 focus:text-gray-800 outline-none resize-none"
                    onChange={(e) => setValue(e.target.value)}
                    value={value}
                    disabled={disabled}
                    rows={value ? value.split("\n").length : 1}
                    placeholder={placeholder}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) onSubmit(e);
                    }}
                />
            )}
            <input
                disabled={disabled}
                type="submit"
                value={cta}
                className={`cursor-pointer font-medium px-4 py-2 ${disabled ? "text-gray-400 bg-gray-100" : "text-gray-50 bg-violet-600 hover:bg-violet-700"}`}
            />
        </form>
    );
}

export default TextCreate;
