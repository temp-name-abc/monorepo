import { FileUpload, SubAppShell } from "ui";
import { getCollection, getDocuments, uploadDocument } from "helpers";
import { useRouter } from "next/router";
import { KEY_COLLECTION, KEY_DOCUMENTS } from "utils";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { links } from "../links";
import { Documents } from "./Documents";
import { useNotification } from "providers";
import { useBillingEnabled } from "hooks";

interface IProps {}

export function CollectionPage({}: IProps) {
    const session = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { setNotification } = useNotification();
    useBillingEnabled("storage.collection.document.process");

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    let collectionId: string | undefined = undefined;
    if (router.query.collectionId) collectionId = router.query.collectionId[0];

    const { data: collectionData } = useQuery([KEY_COLLECTION], () => getCollection(token as string, collectionId as string), {
        enabled: !!token && !!collectionId,
    });

    const { data: documentsData } = useQuery([KEY_DOCUMENTS, collectionId], () => getDocuments(token as string, collectionId as string), {
        enabled: !!token && !!collectionData && !!collectionId,
    });

    const { mutate, isLoading, isSuccess } = useMutation({
        mutationFn: (args: { token: string; collectionId: string; file: File }) => uploadDocument(args.token, args.collectionId, args.file),
        onSuccess: (response) => {
            queryClient.invalidateQueries([KEY_DOCUMENTS, response.collectionId]);

            setNotification({
                title: "Document is uploading",
                description: "Your document is now uploading. Please check back in a bit.",
                severity: "success",
            });
        },
    });

    return (
        <SubAppShell
            title={collectionData?.name ? `Storage / Collections / ${collectionData.name}` : "Storage / Collections / Collection"}
            description="View your documents for the given collection."
            links={links}
        >
            <div className="flex flex-col space-y-12">
                <FileUpload
                    uploadFile={(file) => token && mutate({ token, collectionId: collectionId as string, file })}
                    fileTypes={["text/plain", "application/pdf"]}
                    isLoading={isLoading}
                    isSuccess={isSuccess}
                />
                <Documents documents={documentsData} />
            </div>
        </SubAppShell>
    );
}

export default CollectionPage;
