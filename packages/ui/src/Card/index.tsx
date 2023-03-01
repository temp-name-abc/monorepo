import Link from "next/link";

interface IProps {
    title: string;
    description: string;
    url: string;
    icon: any;
}

export function Card({ title, description, url, icon }: IProps) {
    const halfTitle = Math.floor(title.length / 1.5);

    const titleFirst = title.slice(0, halfTitle);
    const titleSecond = title.slice(halfTitle, title.length);

    return (
        <Link href={url}>
            <div className="p-8 bg-gray-100 hover:bg-gray-200 space-y-4">
                <h3 className="flex items-center space-x-8 font-bold text-lg">
                    <span>
                        <span className="text-violet-600">{titleFirst}</span>
                        <span className="text-gray-900">{titleSecond}</span>
                    </span>
                    <span className="text-gray-900">{icon}</span>
                </h3>
                <p className="font-medium text-gray-600">{description}</p>
            </div>
        </Link>
    );
}

export default Card;
