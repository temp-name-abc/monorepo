import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { KEY_COLLECTION, KEY_COLLECTIONS } from "utils";
import { SubAppShell } from "ui";
import { createCollection, getCollections } from "helpers";
import { Collections } from "./Collections";
import { TextCreate } from "ui/src/TextCreate";
import { links } from "../links";

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
        <SubAppShell title="Storage / Collections" description="View all your collections of documents." links={links}>
            <div className="flex flex-col space-y-12">
                <div className="ml-auto">
                    <TextCreate onClick={(name) => token && mutation.mutate({ token, name })} />
                </div>
                <Collections collections={data} />
            </div>
        </SubAppShell>
    );
}

export default CollectionsPage;
