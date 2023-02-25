import axios from "axios";
import { ICollection, collection, collections, ICollections, IDocuments, document } from "types";

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
    const { data } = await instance.post<ICollection>(
        "/storage/collection",
        {
            name,
        },
        {
            headers: {
                Authorization: token,
            },
        }
    );

    return collection.parse(data);
}

export async function getCollection(token: string, collectionId: string) {
    const { data } = await instance.get<ICollection>(`/storage/collection/${collectionId}`, {
        headers: {
            Authorization: token,
        },
    });

    return collection.parse(data);
}

export async function getDocuments(token: string, collectionId: string) {
    const { data } = await instance.get<IDocuments>(`/storage/collection/${collectionId}/document`, {
        headers: {
            Authorization: token,
        },
    });

    return document.parse(data);
}
