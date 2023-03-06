interface IProps {
    elements: any[];
    emptyText?: string;
}

export function CardLayout({ elements, emptyText }: IProps) {
    if (elements.length > 0 || !emptyText)
        return (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-4">
                {elements.map((Element, i) => (
                    <div key={i}>{Element}</div>
                ))}
            </div>
        );

    return <p className="text-center font-medium text-gray-600">{emptyText}</p>;
}

export default CardLayout;
