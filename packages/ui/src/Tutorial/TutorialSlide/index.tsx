interface IProps {
    title: string;
    descriptions: any[];
}

export function TutorialSlide({ title, descriptions }: IProps) {
    return (
        <div className="flex flex-col space-y-4">
            <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            {descriptions.map((description, i) => (
                <p key={i} className="text-gray-600">
                    {description}
                </p>
            ))}
        </div>
    );
}

export default TutorialSlide;
