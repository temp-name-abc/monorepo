import { FileText, Presentation, School } from "tabler-icons-react";
import { UseCase } from "./UseCase";

interface IProps {}

export function UseCases({}: IProps) {
    return (
        <div className="p-16 bg-gray-900 w-full space-y-16">
            <h2 className="text-3xl font-extrabold text-gray-200">Use Cases</h2>
            <div className="flex flex-col xl:flex-row space-y-16 xl:space-y-0 xl:space-x-10 justify-evenly">
                <UseCase
                    title="Education"
                    description="Access quick and accurate answers to your uni course questions by uploading your notes to our AI chatbot."
                    icon={<School size={48} />}
                />
                <UseCase
                    title="Courses and Seminars"
                    description="Elevate the learning experience for your course or seminar attendees by using our AI chatbot, which can automatically answer questions based on uploaded recordings and notes."
                    icon={<Presentation size={48} />}
                />
                <UseCase
                    title="Documentation"
                    description="Improve customer experience by uploading your documentation to our AI chatbot for quick answers, which reduces the need for customers to search through lengthy documents."
                    icon={<FileText size={48} />}
                />
            </div>
        </div>
    );
}

export default UseCases;
