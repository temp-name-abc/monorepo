import { IContext } from "types";
import Link from "next/link";
import { getCollection, getDocument } from "helpers";
import { KEY_COLLECTION, KEY_DOCUMENT } from "utils";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

interface IProps {
    context: IContext;
}

export function Context({ context }: IProps) {
    const session = useSession();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data: collectionData } = useQuery([KEY_COLLECTION], () => getCollection(token as string, context.collectionId), {
        enabled: !!token,
    });

    const { data: documentData } = useQuery([KEY_DOCUMENT, context.documentId], () => getDocument(token as string, context.collectionId, context.documentId), {
        enabled: !!token,
    });

    return (
        <div className="w-full flex flex-col space-y-4 bg-gray-100 px-8 py-4">
            <div className="italic text-gray-600 font-medium text-sm">{context.body}</div>
            <div className="flex space-x-2">
                <Link className="cursor-pointer font-bold text-gray-600 hover:text-gray-700" href={`/storage/collections/${context.collectionId}`}>
                    {collectionData?.name ? collectionData.name : "Collection"}
                </Link>
                <span className="font-bold text-gray-600">/</span>
                <Link href={documentData?.url ? documentData.url : "#"} className="cursor-pointer font-medium text-gray-600 hover:text-gray-700">
                    {documentData?.name ? documentData.name : "Document"}
                </Link>
            </div>
        </div>
    );
}

export default Context;
