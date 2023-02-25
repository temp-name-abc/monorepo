import { ICollections } from "types";
import { Collection } from "./Collection";

interface IProps {
    collections?: ICollections;
}

export function Collections({ collections }: IProps) {
    if (!collections) return null;

    return (
        <div className="grid grid-cols-4">
            {collections.collections.map((collection, i) => (
                <Collection key={i} collection={collection} />
            ))}
        </div>
    );
}

export default Collections;
