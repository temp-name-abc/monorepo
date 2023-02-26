import { IProduct } from "types";

interface IProps {
    product: IProduct;
}

export function Product({ product }: IProps) {
    return <>{product}</>;
}

export default Product;
