interface IProps {}

export function CollectionsPage({}: IProps) {
    return (
        <div className="space-y-3">
            <h1 className="text-gray-900 font-bold text-xl">Storage / Collections</h1>
            <p className="font-medium text-gray-600">View your document collections.</p>
        </div>
    );
}

export default CollectionsPage;
