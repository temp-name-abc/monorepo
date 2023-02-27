import axios from "axios";
import { IPortalData, IProduct, portalData } from "types";
import { API_BASE_URL } from "utils";

const instance = axios.create({
    baseURL: API_BASE_URL,
});

export async function getPortal(token: string, product?: IProduct) {
    const { data } = await instance.get<IPortalData>(`/billing/portal${product ? "?productId=" + product : ""}`, {
        headers: {
            Authorization: token,
        },
    });

    return portalData.parse(data);
}
