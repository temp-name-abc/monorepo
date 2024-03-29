import { ICollections } from "types";
import { CardLayout } from "ui";
import { Collection } from "./Collection";

interface IProps {
    collections?: ICollections;
}

export function Collections({ collections }: IProps) {
    if (!collections) return null;

    return (
        <CardLayout
            elements={collections.collections.map((collection, i) => (
                <Collection key={i} collection={collection} />
            ))}
            emptyText="No collections yet. Create one to get started!"
        />
    );
}

export default Collections;
