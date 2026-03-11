/* eslint-disable @typescript-eslint/no-explicit-any */
import { QdrantClient } from "@qdrant/js-client-rest";

const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

export const qdrant = new QdrantClient({ url: qdrantUrl });

export const COLLECTION_NAME = "menu_items";

export async function ensureCollection() {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === COLLECTION_NAME,
  );

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 384, // Multilingual-E5-Small dimension
        distance: "Cosine",
      },
    });
    console.log(`Created collection: ${COLLECTION_NAME}`);
  }
}

export async function upsertMenuItemVector(
  id: string,
  vector: number[],
  payload: Record<string, any>,
) {
  return qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: id, // Qdrant expects UUID-like or integer, but string also works depending on format
        vector: vector,
        payload: payload,
      },
    ],
  });
}

export async function searchSimilarMenu(vector: number[], limit: number = 5) {
  return qdrant.search(COLLECTION_NAME, {
    vector: vector,
    limit: limit,
    with_payload: true,
  });
}
