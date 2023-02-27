import { IProduct } from "types";
import { getPortal } from "helpers";
import { KEY_PORTAL } from "utils";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { productData } from "utils";
import { Button } from "../../Button";

interface IProps {
    product: IProduct;
}

export function Product({ product }: IProps) {
    const session = useSession();

    // @ts-expect-error
    const token: string | undefined = session.data?.idToken;

    const { data: portalData } = useQuery([KEY_PORTAL, product], () => getPortal(token as string, product), {
        enabled: !!token,
    });

    const data = productData[product];

    return (
        <div className="flex justify-between items-start">
            <div className="flex flex-col space-y-2">
                <h3 className="text-gray-900 font-bold">{data.name}</h3>
                <p className="font-medium text-gray-600 text-sm">{data.description}</p>
            </div>
            {portalData && (
                <Button type="link" variant={portalData.active ? "dull" : "accent"} href={portalData.url}>
                    {portalData.active ? "Manage" : "Subscribe"}
                </Button>
            )}
        </div>
    );
}

export default Product;
