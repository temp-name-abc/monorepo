import { useState } from "react";

interface IProps {}

export function FileUpload({}: IProps) {
    const [files, setFiles] = useState<File[]>([]);

    return (
        <form>
            <div className="flex justify-center">
                <input
                    className="w-full cursor-pointer bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-800 file:cursor-pointer file:border-0 file:bg-violet-600 file:hover:bg-violet-700 file:px-4 file:py-2 file:text-gray-50 file:[margin-inline-end:0.75rem] file:font-medium"
                    type="file"
                    multiple={true}
                    onChange={(e) => {
                        const x = e.target.files;

                        // const y = x[0];
                    }}
                />
            </div>
        </form>
    );
}

export default FileUpload;
