import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { StorageSubAppShell } from "../StorageSubAppShell";
import { COLLECTIONS_KEY } from "utils";
import { getCollections } from "helpers";
import { Collections } from "./Collections";

interface IProps {}

export function CollectionsPage({}: IProps) {
    const session = useSession();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data, isLoading, isError } = useQuery([COLLECTIONS_KEY], () => getCollections(token as string), {
        enabled: !!token,
    });

    return (
        <StorageSubAppShell>
            <div className="space-y-10">
                <header className="space-y-3">
                    <h2 className="text-gray-900 font-bold text-xl">Storage / Collections</h2>
                    <p className="font-medium text-gray-600">View your document collections.</p>
                </header>
                <Collections collections={data} />
            </div>
        </StorageSubAppShell>
    );
}

export default CollectionsPage;
