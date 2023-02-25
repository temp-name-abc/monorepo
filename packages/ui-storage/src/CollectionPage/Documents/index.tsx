import { IDocuments } from "types";

interface IProps {
    documents?: IDocuments;
}

export function Documents({ documents }: IProps) {
    if (!documents) return null;

    return (
        <div className="grid grid-cols-4 gap-10">
            {documents.documents.map((document, i) => (
                <Collection key={i} collection={collection} />
            ))}
        </div>
    );
}

export default Documents;
