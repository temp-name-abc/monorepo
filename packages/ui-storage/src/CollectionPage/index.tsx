import { getCollection, getDocuments } from "helpers";
import { useRouter } from "next/router";
import { SubAppShell } from "ui/src/SubAppShell";
import { KEY_COLLECTION, KEY_DOCUMENTS } from "utils";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
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

    const { data: documentsData } = useQuery([KEY_DOCUMENTS], () => getDocuments(token as string, collectionId as string), {
        enabled: !!token && !!collectionData,
    });

    return (
        <SubAppShell
            title={collectionData?.name ? `Storage / Collections / ${collectionData.name}` : "Storage / Collections / Collection"}
            description="View your documents for the given collection."
            links={storageLinks}
        >
            <div className="flex flex-col space-y-12">
                <Documents />
            </div>
        </SubAppShell>
    );
}

export default CollectionPage;
