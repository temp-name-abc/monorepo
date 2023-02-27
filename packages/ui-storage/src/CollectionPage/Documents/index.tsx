import { IDocuments } from "types";
import { Document } from "./Document";

interface IProps {
    documents?: IDocuments;
}

export function Documents({ documents }: IProps) {
    if (!documents) return null;

    return (
        <div className="grid grid-cols-3 gap-10">
            {documents.documents.map((document, i) => (
                <Document key={i} document={document} />
            ))}
        </div>
    );
}

export default Documents;
