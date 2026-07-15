import { ObjectId } from "mongodb";

import { getDB } from "../db/mongo.ts";

export type IngestJobStatus = "queued" | "processing" | "done" | "failed";

// One record per queued ingestion — the source of truth for "what is the
// pipeline doing with this document". Failed jobs keep their last error so the
// library UI can show why a document never became searchable.
export interface IngestJob {
  _id: string;
  source: string;
  contentType: string;
  sizeBytes: number;
  status: IngestJobStatus;
  error?: string;
  chunks?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IngestJobRow {
  _id: ObjectId;
  source: string;
  contentType: string;
  sizeBytes: number;
  status: IngestJobStatus;
  error?: string;
  chunks?: number;
  createdAt: Date;
  updatedAt: Date;
}

const getCollectionName = () =>
  process.env.INGEST_JOB_COLLECTION_NAME ?? "rag_ingest_jobs";

const getCollection = () =>
  getDB().collection<IngestJobRow>(getCollectionName());

const toIngestJob = (row: IngestJobRow): IngestJob => ({
  _id: row._id.toString(),
  source: row.source,
  contentType: row.contentType,
  sizeBytes: row.sizeBytes,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  ...(typeof row.error === "string" ? { error: row.error } : {}),
  ...(typeof row.chunks === "number" ? { chunks: row.chunks } : {}),
});

export const createIngestJob = async (input: {
  source: string;
  contentType: string;
  sizeBytes: number;
}): Promise<string> => {
  const now = new Date();

  const result = await getCollection().insertOne({
    _id: new ObjectId(),
    source: input.source,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    status: "queued",
    createdAt: now,
    updatedAt: now,
  });

  return result.insertedId.toString();
};

export const getIngestJob = async (id: string): Promise<IngestJob | null> => {
  if (!ObjectId.isValid(id)) return null;

  const row = await getCollection().findOne({ _id: new ObjectId(id) });

  return row ? toIngestJob(row) : null;
};

export const markIngestJobProcessing = async (id: string): Promise<void> => {
  await getCollection().updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { status: "processing" as const, updatedAt: new Date() },
      // A retry clears the previous attempt's error.
      $unset: { error: "" },
    },
  );
};

export const markIngestJobDone = async (
  id: string,
  chunks: number,
): Promise<void> => {
  await getCollection().updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { status: "done" as const, chunks, updatedAt: new Date() },
      $unset: { error: "" },
    },
  );
};

export const markIngestJobFailed = async (
  id: string,
  error: string,
): Promise<void> => {
  await getCollection().updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "failed" as const, error, updatedAt: new Date() } },
  );
};

// Latest job per source, across all statuses. The library listing overlays
// these onto the indexed documents: a source whose most recent job is still
// queued/processing/failed shows that state instead of (or on top of) its
// chunks, while a source whose latest job is done is represented by the chunks
// themselves.
export const listLatestJobsBySource = async (): Promise<IngestJob[]> => {
  const rows = await getCollection()
    .aggregate<IngestJobRow>([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$source", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
    ])
    .toArray();

  return rows.map(toIngestJob);
};

export const deleteIngestJobsForSource = async (
  source: string,
): Promise<number> => {
  const result = await getCollection().deleteMany({ source });

  return result.deletedCount ?? 0;
};
