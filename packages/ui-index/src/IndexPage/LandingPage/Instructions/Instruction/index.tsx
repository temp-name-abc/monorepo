interface IProps {
    title: any;
    description: any;
    card: any;
}

export function Instruction({ title, description, card }: IProps) {
    return (
        <div className="space-y-12 w-full">
            <div className="space-y-6">
                <h2 className="font-extrabold text-gray-900 text-4xl">{title}</h2>
                <p className="text-gray-600 text-lg max-w-xl">{description}</p>
            </div>
            {card}
        </div>
    );
}

export default Instruction;
