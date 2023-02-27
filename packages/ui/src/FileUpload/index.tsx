import { useState } from "react";

interface IProps {
    uploadFile: (file: File) => any;
    fileTypes?: string[];
}

export function FileUpload({ uploadFile, fileTypes }: IProps) {
    const [files, setFiles] = useState<File[]>([]);

    return (
        <form
            className="flex justify-between space-x-2"
            onSubmit={(e) => {
                e.preventDefault();

                if (files.length === 0) return;

                files.forEach(uploadFile);
            }}
        >
            <input
                className="cursor-pointer font-medium bg-gray-100 text-gray-400 hover:bg-gray-200 file:cursor-pointer file:border-0 file:bg-violet-600 file:hover:bg-violet-700 file:px-4 file:py-2 file:text-gray-50 file:[margin-inline-end:0.75rem] file:font-medium"
                type="file"
                multiple={true}
                onChange={(e) => {
                    const _files = e.target.files;

                    if (_files === null) return;

                    setFiles(Array.from(_files));
                }}
                accept={fileTypes ? fileTypes.join(",") : undefined}
            />
            <input type="submit" value="Upload" className="cursor-pointer font-medium px-4 py-2 text-gray-50 bg-violet-600 hover:bg-violet-700" />
        </form>
    );
}

export default FileUpload;
