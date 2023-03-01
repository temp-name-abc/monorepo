import { IDocuments } from "types";
import { CardLayout } from "ui";
import { Document } from "./Document";

interface IProps {
    documents?: IDocuments;
}

export function Documents({ documents }: IProps) {
    if (!documents) return null;

    return (
        <CardLayout
            elements={documents.documents.map((document, i) => (
                <Document key={i} document={document} />
            ))}
        />
    );
}

export default Documents;
