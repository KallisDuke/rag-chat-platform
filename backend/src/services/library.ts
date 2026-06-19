import { getDB } from "../db/mongo.ts";

export interface LibraryDocument {
  source: string;
  chunks: number;
  sizeBytes: number;
  indexedAt: Date;
}

interface LibraryAggregateRow {
  _id: string;
  chunks: number;
  sizeBytes: number | null;
  indexedAt: Date;
}

export const listLibraryDocuments = async (): Promise<LibraryDocument[]> => {
  const collectionName = process.env.COLLECTION_NAME;

  if (!collectionName) {
    throw new Error("COLLECTION_NAME environment variable is required");
  }

  const collection = getDB().collection(collectionName);

  const rows = await collection
    .aggregate<LibraryAggregateRow>([
      {
        $group: {
          _id: "$source",
          chunks: { $sum: 1 },
          sizeBytes: { $first: "$sizeBytes" },
          indexedAt: { $max: "$createdAt" },
        },
      },
      { $sort: { indexedAt: -1 } },
    ])
    .toArray();

  return rows.map((row) => ({
    source: row._id,
    chunks: row.chunks,
    sizeBytes: row.sizeBytes ?? 0,
    indexedAt: row.indexedAt,
  }));
};
