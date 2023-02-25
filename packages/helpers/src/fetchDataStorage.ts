import axios from "axios";
import { ICollection, collection, collections, ICollections } from "types";

import { API_BASE_URL } from "utils";

const instance = axios.create({
    baseURL: API_BASE_URL,
});

export async function getCollections(token: string) {
    const { data } = await instance.get<ICollections>("/storage/collection", {
        headers: {
            Authorization: token,
        },
    });

    return collections.parse(data);
}

export async function createCollection(token: string, name: string) {
    const { data } = await instance.get<ICollection>("/storage/collection", {
        headers: {
            Authorization: token,
        },
    });

    return { ...collections.parse(data), name };
}
