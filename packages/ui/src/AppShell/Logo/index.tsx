import Link from "next/link";

interface IProps {}

export function Logo({}: IProps) {
    return (
        <Link href="/">
            <h1 className="font-bold text-lg">
                <span className="text-gray-900">MONO</span>
                <span className="text-violet-600">STACK</span>
            </h1>
        </Link>
    );
}

export default Logo;
