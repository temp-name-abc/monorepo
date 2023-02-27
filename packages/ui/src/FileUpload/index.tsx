import { useEffect, useState } from "react";

interface IProps {
    uploadFile: (file: File) => any;
    fileTypes?: string[];
    isLoading?: boolean;
    isSuccess?: boolean;
}

export function FileUpload({ uploadFile, fileTypes, isLoading, isSuccess }: IProps) {
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (!isLoading && isSuccess) setFiles([]);
    }, [isLoading, isSuccess]);

    return (
        <form
            className="flex justify-between space-x-2"
            onSubmit={async (e) => {
                e.preventDefault();

                if (files.length === 0) return;

                files.forEach(uploadFile);
            }}
        >
            <input
                className="cursor-pointer font-medium bg-gray-100 text-gray-400 hover:bg-gray-200 file:cursor-pointer file:border-0 file:bg-violet-600 file:hover:bg-violet-700 file:px-4 file:py-2 file:text-gray-50 file:[margin-inline-end:0.75rem] file:font-medium"
                type="file"
                value={files.length > 0 ? undefined : ""}
                multiple={true}
                onChange={(e) => {
                    const _files = e.target.files;

                    if (_files === null) return;

                    setFiles(Array.from(_files));
                }}
                accept={fileTypes ? fileTypes.join(",") : undefined}
                disabled={isLoading}
            />
            <input
                type="submit"
                value="Upload"
                className={`cursor-pointer font-medium px-4 py-2 ${isLoading ? "text-gray-400 bg-gray-100" : "text-gray-50 bg-violet-600 hover:bg-violet-700"}`}
                disabled={isLoading}
            />
        </form>
    );
}

export default FileUpload;
