import { X } from "tabler-icons-react";

interface IProps {
    title: string;
    isActive: boolean;
    children: any;
    setIsActive?: (isActive: boolean) => void;
}

export function Modal({ title, isActive, children, setIsActive }: IProps) {
    if (!isActive) return null;

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
                <div className="fixed inset-0 transition-opacity bg-gray-500 opacity-50" />
                <div className="relative z-10 w-full max-w-lg bg-white shadow-lg p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-600 font-medium">{title}</h3>
                        {setIsActive && (
                            <button className="text-gray-900 font-bold" onClick={() => setIsActive(false)}>
                                <X />
                            </button>
                        )}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;
