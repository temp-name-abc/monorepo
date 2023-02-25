import { FileUpload } from "ui";
import { getCollection, getDocuments, uploadDocument } from "helpers";
import { useRouter } from "next/router";
import { SubAppShell } from "ui/src/SubAppShell";
import { KEY_COLLECTION, KEY_DOCUMENTS } from "utils";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { storageLinks } from "../storageLinks";
import { Documents } from "./Documents";

interface IProps {}

export function CollectionPage({}: IProps) {
    const session = useSession();
    const router = useRouter();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { collectionId } = router.query;

    const { data: collectionData } = useQuery([KEY_COLLECTION], () => getCollection(token as string, collectionId as string), {
        enabled: !!token,
    });

    const { data: documentsData } = useQuery([KEY_DOCUMENTS, collectionId], () => getDocuments(token as string, collectionId as string), {
        enabled: !!token && !!collectionData,
    });

    const mutation = useMutation({
        mutationFn: (args: { token: string; collectionId: string; file: File }) => uploadDocument(args.token, args.collectionId, args.file),
    });

    return (
        <SubAppShell
            title={collectionData?.name ? `Storage / Collections / ${collectionData.name}` : "Storage / Collections / Collection"}
            description="View your documents for the given collection."
            links={storageLinks}
        >
            <div className="flex flex-col space-y-12">
                <FileUpload uploadFile={(file) => token && mutation.mutate({ token, collectionId: collectionId as string, file })} />
                <Documents documents={documentsData} />
            </div>
        </SubAppShell>
    );
}

export default CollectionPage;
