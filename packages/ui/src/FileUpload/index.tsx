import { useState } from "react";

interface IProps {}

export function FileUpload({}: IProps) {
    const [files, setFiles] = useState<File[]>([]);

    return (
        <form
            className="flex items-center justify-between space-x-2"
            onSubmit={(e) => {
                e.preventDefault();

                if (files.length === 0) return;

                console.log(files);
            }}
        >
            <input
                className="cursor-pointer bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-800 file:cursor-pointer file:border-0 file:bg-violet-600 file:hover:bg-violet-700 file:px-4 file:py-2 file:text-gray-50 file:[margin-inline-end:0.75rem] file:font-medium"
                type="file"
                multiple={true}
                onChange={(e) => {
                    const _files = e.target.files;

                    if (_files === null) return;

                    setFiles(Array.from(_files));
                }}
            />
            <input type="submit" value="Upload" className="cursor-pointer font-medium px-4 py-2 text-gray-50 bg-violet-600 hover:bg-violet-700" />
        </form>
    );
}

export default FileUpload;
