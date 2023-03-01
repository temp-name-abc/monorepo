import { useQuery } from "@tanstack/react-query";
import { getCollections } from "helpers";
import { useSession } from "next-auth/react";
import { IChats } from "types";
import { DropdownSelect } from "ui";
import { KEY_COLLECTIONS } from "utils";

interface IProps {
    setCollectionId: (collectionId: string) => void;
    chatsData: IChats;
}

export function SelectCollection({ setCollectionId, chatsData }: IProps) {
    const session = useSession();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data: collectionsData } = useQuery([KEY_COLLECTIONS], () => getCollections(token as string), {
        enabled: !!token,
    });

    // Get the selected collection id
    let selectedCollectionId: string | undefined = undefined;

    const chats = chatsData.chats;

    if (chats.length !== 0) {
        const context = chats[chats.length - 1].context;

        if (context.length !== 0) selectedCollectionId = context[context.length - 1].collectionId;
    }

    if (!collectionsData) return null;

    return (
        <div className="w-1/4">
            <DropdownSelect
                options={collectionsData.collections.map((collection) => [collection.collectionId, collection.name])}
                onChange={setCollectionId}
                selected={selectedCollectionId}
            />
        </div>
    );
}

export default SelectCollection;
