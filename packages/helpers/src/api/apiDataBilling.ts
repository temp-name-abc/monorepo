import axios from "axios";
import { IPortalData, IProduct, portalData } from "types";
import { API_BASE_URL } from "utils";

const instance = axios.create({
    baseURL: API_BASE_URL,
});

export async function getPortal(token: string) {
    const { data } = await instance.get<IPortalData>("/billing/portal", {
        headers: {
            Authorization: token,
        },
    });

    return portalData.parse(data);
}
