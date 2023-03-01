import { IChatData, IProduct, IProductData } from "types";

export const API_BASE_URL = "https://wkpf3087f5.execute-api.ap-southeast-2.amazonaws.com/prod";
export const HOME_BASE_URL = "https://monostack.app";

export const productData: { [key in IProduct]: IProductData } = {
    "chat.conversation.chat": {
        name: "Chat",
        description: "Pay for each chat you send to a chatbot hosted on the platform.",
    },
    "storage.collection.document.process": {
        name: "Process Document",
        description: "Pay for each character contained within the documents you upload.",
    },
};

export const chatData: IChatData = {
    chunkCharacters: 400,
    chatMemoryLength: 5,
    documentsRetrieved: 3,
    matchingThreshold: 0.6,
    maxCharacters: 400,
};
