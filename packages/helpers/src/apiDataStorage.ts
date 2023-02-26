import axios from "axios";
import { ICollection, collection, collections, ICollections, IDocuments, document, documents, IDocument } from "types";

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

    return documents.parse(data);
}

export async function getDocument(token: string, collectionId: string, documentId: string) {
    const { data } = await instance.get<IDocument>(`/storage/collection/${collectionId}/document/${documentId}`, {
        headers: {
            Authorization: token,
        },
    });

    return document.parse(data);
}

export async function uploadDocument(token: string, collectionId: string, file: File) {
    const { data } = await instance.post(
        `/storage/collection/${collectionId}/document`,
        {
            type: file.type,
            name: file.name,
        },
        {
            headers: {
                Authorization: token,
            },
        }
    );

    const formData = new FormData();
    Object.keys(data.fields).forEach((key) => formData.append(key, data.fields[key]));
    formData.append("file", file);

    await axios.post(data.url, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}
