import { getDB } from "../db/mongo.ts";
import {
  deleteIngestJobsForSource,
  listLatestJobsBySource,
} from "./ingestJobs.ts";

export type LibraryDocumentStatus =
  | "indexed"
  | "queued"
  | "processing"
  | "failed";

export interface LibraryDocument {
  source: string;
  chunks: number;
  sizeBytes: number;
  indexedAt: Date;
  status: LibraryDocumentStatus;
  error?: string;
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
    ])
    .toArray();

  const documents = new Map<string, LibraryDocument>();

  for (const row of rows) {
    documents.set(row._id, {
      source: row._id,
      chunks: row.chunks,
      sizeBytes: row.sizeBytes ?? 0,
      indexedAt: row.indexedAt,
      status: "indexed",
    });
  }

  // Overlay the latest ingest job per source: a queued/processing/failed job
  // is more current than whatever chunks are (or aren't) indexed for that
  // source. Sources whose latest job is done are already represented by their
  // chunks above.
  for (const job of await listLatestJobsBySource()) {
    if (job.status === "done") continue;

    const existing = documents.get(job.source);

    documents.set(job.source, {
      source: job.source,
      chunks: existing?.chunks ?? 0,
      sizeBytes: job.sizeBytes || (existing?.sizeBytes ?? 0),
      indexedAt: existing?.indexedAt ?? job.createdAt,
      status: job.status,
      ...(job.error ? { error: job.error } : {}),
    });
  }

  return [...documents.values()].sort(
    (a, b) => b.indexedAt.getTime() - a.indexedAt.getTime(),
  );
};

export interface DeletedLibraryDocument {
  deletedChunks: number;
  deletedJobs: number;
}

// Removes a document: every chunk indexed under it plus its ingest-job
// history, so queued/failed rows disappear from the library too.
export const deleteLibraryDocument = async (
  source: string,
): Promise<DeletedLibraryDocument> => {
  const collectionName = process.env.COLLECTION_NAME;

  if (!collectionName) {
    throw new Error("COLLECTION_NAME environment variable is required");
  }

  const collection = getDB().collection(collectionName);

  const result = await collection.deleteMany({ source });
  const deletedJobs = await deleteIngestJobsForSource(source);

  return {
    deletedChunks: result.deletedCount ?? 0,
    deletedJobs,
  };
};
