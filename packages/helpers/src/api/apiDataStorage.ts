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
    const reader = new FileReader();
    reader.readAsDataURL(file);

    await new Promise<void>(
        (res) =>
            (reader.onload = async () => {
                const processedFile = reader.result?.toString().split(",")[1];

                await instance.post(
                    `/storage/collection/${collectionId}/document`,
                    {
                        type: file.type,
                        name: file.name,
                        file: processedFile,
                    },
                    {
                        headers: {
                            Authorization: token,
                        },
                    }
                );

                res();
            })
    );

    return { collectionId, fileName: file.name };
}

export async function deleteDocument(token: string, collectionId: string, documentId: string) {
    await instance.delete<IDocument>(`/storage/collection/${collectionId}/document/${documentId}`, {
        headers: {
            Authorization: token,
        },
    });

    return {
        documentId,
        collectionId,
    };
}
