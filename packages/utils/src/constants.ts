import { IChatData, IProduct, IProductData } from "types";

export const API_BASE_URL = "https://wkpf3087f5.execute-api.ap-southeast-2.amazonaws.com/prod";
export const HOME_BASE_URL = "https://monorepo-web-eta.vercel.app";

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
    documentsRetrieved: 3,
    matchingThreshold: 0.6,
    maxCharacters: 400,
};
