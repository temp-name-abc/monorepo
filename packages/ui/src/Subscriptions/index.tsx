import { IProduct } from "types";
import { Product } from "./Product";

interface IProps {
    products: IProduct[];
}

export function Subscriptions({ products }: IProps) {
    return (
        <div className="flex flex-col space-y-8">
            {products.map((product, i) => (
                <Product key={i} product={product} />
            ))}
        </div>
    );
}

export default Subscriptions;
