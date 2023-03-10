import { SignIn } from "ui";

interface IProps {}

export function Header({}: IProps) {
    return (
        <header className="py-24 px-16 space-y-16">
            <div className="space-y-6">
                <h1 className="text-6xl font-extrabold text-gray-900">
                    <span className="block">Welcome, to</span>
                    <span className="block text-violet-600">MonoStack</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl">
                    The number one platform powering <span className="font-medium">natural language</span> conversations with your data. Don't let your customers{" "}
                    <span className="font-medium">search</span> for information, let them <span className="font-medium">ask</span> for it.
                </p>
            </div>
            <SignIn title="Get Started" thick={true} />
        </header>
    );
}
export default Header;
