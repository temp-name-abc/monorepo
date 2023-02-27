import { Download, FileDownload } from "tabler-icons-react";

import { IDocument } from "types";

interface IProps {
    document: IDocument;
}

export function Document({ document }: IProps) {
    return (
        <div className="flex items justify-between text-gray-800 bg-gray-200 hover:bg-gray-300 px-8 py-4 font-medium space-x-4">
            <span className="overflow-hidden" title={document.name}>
                {document.name}
            </span>
            <a title="Download original file" href={document.fileUrl}>
                {<Download />}
            </a>
            <a title="Download processed file" href={document.processedFileUrl}>
                {<FileDownload />}
            </a>
        </div>
    );
}

export default Document;
