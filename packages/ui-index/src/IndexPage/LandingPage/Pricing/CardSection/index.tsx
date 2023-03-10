interface IProps {
    title: string;
    pricing: { heading: string; price: string }[];
}

export function CardSection({ title, pricing }: IProps) {
    return (
        <div className="space-y-2">
            <h3 className="text-gray-900 font-bold">{title}</h3>
            <div className="flex flex-col space-y-1 pl-4">
                {pricing.map((price, i) => (
                    <p className="text-gray-700 flex items-start justify-between w-full" key={i}>
                        <span>{price.heading}</span>
                        <span>{price.price}</span>
                    </p>
                ))}
            </div>
        </div>
    );
}

export default CardSection;
