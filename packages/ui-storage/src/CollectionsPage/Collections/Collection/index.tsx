import Link from "next/link";
import { Folder } from "tabler-icons-react";

import { ICollection } from "types";

interface IProps {
    collection: ICollection;
}

export function Collection({ collection }: IProps) {
    return (
        <Link
            href={`/storage/collections/${collection.collectionId}`}
            className="flex items justify-between text-gray-800 bg-gray-200 hover:bg-gray-300 px-8 py-4 font-medium space-x-4"
        >
            <span className="overflow-hidden" title={collection.name}>
                {collection.name}
            </span>
            <span>{<Folder />}</span>
        </Link>
    );
}

export default Collection;
