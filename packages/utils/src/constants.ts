import { envVariable, IChatData, IProduct, IProductData } from "types";

export const API_BASE_URL = envVariable.parse(process.env.NEXT_PUBLIC_API_BASE_URL);

export const productData: { [key in IProduct]: IProductData } = {
    "chat.chat": {
        name: "Chat",
        description: "Send chats to the chatbot.",
    },
    "storage.document.process.text": {
        name: "Text document processing",
        description: "Upload, process, and store text documents.",
    },
};

export const chatData: IChatData = {
    chunkCharacters: 400,
    chatMemoryLength: 5,
    contextMemoryLength: 5,
    documentsRetrieved: 2,
    matchingThreshold: 0.6,
    maxCharacters: 400,
};
