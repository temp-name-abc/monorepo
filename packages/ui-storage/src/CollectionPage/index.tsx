import { getCollection } from "helpers";
import { useRouter } from "next/router";
import { SubAppShell } from "ui/src/SubAppShell";
import { KEY_COLLECTION } from "utils";
import { useQuery } from "@tanstack/react-query";
import { storageLinks } from "../storageLinks";

interface IProps {}

export function CollectionPage({}: IProps) {
    const router = useRouter();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { collectionId } = router.query;

    const { data } = useQuery([KEY_COLLECTION], () => getCollection(token as string, collectionId as string), {
        enabled: !!token,
    });

    return (
        <SubAppShell title={`Storage / Collections / `} description="View your documents for the given collection." links={storageLinks}>
            {JSON.stringify(data)}
        </SubAppShell>
    );
}

export default CollectionPage;
