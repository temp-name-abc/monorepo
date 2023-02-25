import { useRouter } from "next/router";
import SubAppShell from "ui/src/SubAppShell";
import storageLinks from "../storageLinks";

interface IProps {}

export function CollectionPage({}: IProps) {
    const router = useRouter();

    const { collectionId } = router.query;

    return (
        <SubAppShell title={`Storage / Collections / `} description="View your documents for the given collection." links={storageLinks}>
            {collectionId}
        </SubAppShell>
    );
}

export default CollectionPage;
