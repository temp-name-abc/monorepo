import { IChatData, IProduct, IProductData } from "types";

export const API_BASE_URL = "https://api.monostack.app";
export const HOME_BASE_URL = "https://www.monostack.app";
export const PRIVACY_POLICY_URL = "https://drive.google.com/file/d/1qJ2I2SE7daszKs9ekGJc--GjR2391MxS/view?usp=sharing";
export const FACEBOOK_URL = "https://www.facebook.com/monostack";

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
    chunkCharacters: 1000,
    chatMemoryLength: 5,
    documentsRetrieved: 2,
    matchingThreshold: 0.75,
    maxCharacters: 600,
};
