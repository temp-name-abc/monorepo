import { IChatData } from "types";

export const API_BASE_URL = "https://api.monostack.app";
export const HOME_BASE_URL = "https://www.monostack.app";
export const PRIVACY_POLICY_URL = "https://docs.google.com/document/d/1LCJVV2ggFMtZf-j5e2eMRqjuKH-1OZT7PWHRQkGe1Rg/edit?usp=sharing";
export const FACEBOOK_URL = "https://www.facebook.com/monostack";

export const chatData: IChatData = {
    chunkCharacters: 1000,
    documentsRetrieved: 2,
    matchingThreshold: 0.7,
    maxCharacters: 600,
    extendDown: 1,
    extendUp: 0,
};
