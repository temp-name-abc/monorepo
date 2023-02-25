import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { StorageSubAppShell } from "../StorageSubAppShell";
import { KEY_COLLECTION, KEY_COLLECTIONS } from "utils";
import { createCollection, getCollections } from "helpers";
import { Collections } from "./Collections";
import TextCreate from "ui/src/TextCreate";

interface IProps {}

export function CollectionsPage({}: IProps) {
    const session = useSession();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const queryClient = useQueryClient();

    const { data } = useQuery([KEY_COLLECTIONS], () => getCollections(token as string), {
        enabled: !!token,
    });

    const mutation = useMutation({
        mutationFn: (args: { token: string; name: string }) => createCollection(args.token, args.name),
        onSuccess: (collection) => {
            queryClient.invalidateQueries([KEY_COLLECTIONS]);
            queryClient.setQueryData([KEY_COLLECTION, collection.collectionId], collection);
        },
    });

    return (
        <StorageSubAppShell>
            <div className="flex flex-col space-y-12">
                <header className="space-y-3">
                    <h2 className="text-gray-900 font-bold text-xl">Storage / Collections</h2>
                    <p className="font-medium text-gray-600">View your document collections.</p>
                </header>
                <div className="ml-auto">
                    <TextCreate onClick={(name) => token && mutation.mutate({ token, name })} />
                </div>
                <Collections collections={data} />
            </div>
        </StorageSubAppShell>
    );
}

export default CollectionsPage;
