import Link from "next/link";
import { File } from "tabler-icons-react";

import { IDocument } from "types";

interface IProps {
    document: IDocument;
}

export function Document({ document }: IProps) {
    return (
        <Link
            href={`/storage/collections/${collection.collectionId}`}
            className="flex items justify-between text-gray-800 bg-gray-200 hover:bg-gray-300 px-8 py-4 font-medium"
        >
            <span>{collection.name}</span>
            <span>{<Folder />}</span>
        </Link>
    );
}

export default Collection;
