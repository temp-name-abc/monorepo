import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteDocument } from "helpers";
import { useSession } from "next-auth/react";
import { useNotification } from "providers";
import { Download, FileDownload, Trash } from "tabler-icons-react";
import { IDocument } from "types";
import { KEY_DOCUMENT, KEY_DOCUMENTS } from "utils";

interface IProps {
    document: IDocument;
}

export function Document({ document }: IProps) {
    const session = useSession();
    const queryClient = useQueryClient();
    const { addNotification } = useNotification();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { mutate } = useMutation({
        mutationFn: (args: { token: string; collectionId: string; documentId: string }) => deleteDocument(args.token, args.collectionId, args.documentId),
        onSuccess: (response) => {
            queryClient.invalidateQueries([KEY_DOCUMENT, response.documentId]);
            queryClient.invalidateQueries([KEY_DOCUMENTS, response.collectionId]);

            addNotification({
                title: "Document deletion scheduled",
                description: "Your document has been successfully scheduled for deletion. Please check back in a bit.",
                severity: "success",
            });
        },
    });

    return (
        <div className="flex items-start justify-between text-gray-800 bg-gray-200 hover:bg-gray-300 px-8 py-4 font-medium space-x-4 cursor-pointer">
            <span className="overflow-hidden" title={document.name}>
                {document.name}
            </span>
            <div className="flex items-center space-x-4">
                <a title="Download original file" href={document.fileUrl}>
                    <Download />
                </a>
                <a title="Download processed file" href={document.processedFileUrl}>
                    <FileDownload />
                </a>
                <button
                    className="text-red-500"
                    title="Delete document"
                    onClick={() => token && mutate({ token, collectionId: document.collectionId, documentId: document.documentId })}
                >
                    <Trash />
                </button>
            </div>
        </div>
    );
}

export default Document;
