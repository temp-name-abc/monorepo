import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { KEY_COLLECTION, KEY_COLLECTIONS } from "utils";
import { SubAppShell, TextCreate } from "ui";
import { createCollection, getCollections } from "helpers";
import { Collections } from "./Collections";
import { links } from "../links";
import { useNotification } from "providers";

interface IProps {}

export function CollectionsPage({}: IProps) {
    const session = useSession();
    const queryClient = useQueryClient();
    const { addNotification } = useNotification();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data } = useQuery([KEY_COLLECTIONS], () => getCollections(token as string), {
        enabled: !!token,
    });

    const { mutate, isLoading } = useMutation({
        mutationFn: (args: { token: string; name: string }) => createCollection(args.token, args.name),
        onSuccess: (collection) => {
            queryClient.invalidateQueries([KEY_COLLECTIONS]);
            queryClient.setQueryData([KEY_COLLECTION, collection.collectionId], collection);
        },
        onError: (err) => {
            addNotification({
                title: "Could not create collection",
                // @ts-expect-error
                description: `Not able to create new collection for reason: '${err.message}'`,
                severity: "error",
            });
        },
    });

    return (
        <SubAppShell title="Storage / Collections" description="View all your collections of documents." links={links}>
            <div className="flex flex-col space-y-12">
                <div className="ml-auto">
                    <TextCreate onClick={(name) => token && mutate({ token, name })} cta="Create" placeholder="Create a collection" disabled={isLoading} />
                </div>
                <Collections collections={data} />
            </div>
        </SubAppShell>
    );
}

export default CollectionsPage;
