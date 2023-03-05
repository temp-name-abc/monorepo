interface IProps {
    elements: any[];
}

export function CardLayout({ elements }: IProps) {
    return (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-10">
            {elements.map((Element, i) => (
                <div key={i}>{Element}</div>
            ))}
        </div>
    );
}

export default CardLayout;
