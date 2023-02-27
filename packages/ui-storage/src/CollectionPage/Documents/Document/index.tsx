import { FileText } from "tabler-icons-react";

import { IDocument } from "types";

interface IProps {
    document: IDocument;
}

export function Document({ document }: IProps) {
    return (
        <a
            href={document.url}
            className="flex items justify-between text-gray-800 bg-gray-200 hover:bg-gray-300 px-8 py-4 font-medium space-x-4"
            target="_blank"
            rel="noreferrer"
        >
            <span className="overflow-hidden">{document.name}</span>
            <span>{<FileText />}</span>
        </a>
    );
}

export default Document;
