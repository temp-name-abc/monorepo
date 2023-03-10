interface IProps {
    title: string;
    description: string;
    icon: any;
}

export function UseCase({ title, description, icon }: IProps) {
    return (
        <div className="flex flex-col items-center text-gray-50 w-full">
            {icon}
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-gray-400 w-4/5 text-center mt-2">{description}</p>
        </div>
    );
}

export default UseCase;
