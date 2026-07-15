import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { embeddings } from "../utils/embeddings.ts";

import { getDB } from "../db/mongo.ts";

export interface PageText {
  pageNumber: number;
  text: string;
}

interface StoredDocumentChunk {
  content: string;
  embedding: number[];
  source: string;
  sizeBytes: number;
  // Present for page-based documents (PDFs) — lets citations deep-link to the
  // exact page in the original file.
  pageNumber?: number;
  createdAt: Date;
}

export const ingestDocument = async (
  text: string,
  fileName: string,
  sizeBytes: number,
  pages?: PageText[],
): Promise<number> => {
  const collectionName = process.env.COLLECTION_NAME;

  if (!collectionName) {
    throw new Error("COLLECTION_NAME environment variable is required");
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  // When per-page text is available (PDFs), each page is chunked separately so
  // every chunk records the page it came from. Plain text has no pages and is
  // chunked as a single block.
  const parts: { text: string; pageNumber?: number }[] =
    pages && pages.length > 0
      ? pages
          .filter((page) => page.text.trim())
          .map((page) => ({ text: page.text, pageNumber: page.pageNumber }))
      : [{ text }];

  // Split everything up front so all chunks go to the embeddings API in one
  // batched call instead of one request per chunk.
  const pending: { content: string; pageNumber?: number }[] = [];

  for (const part of parts) {
    const chunks = await splitter.createDocuments([part.text]);

    for (const chunk of chunks) {
      pending.push({
        content: chunk.pageContent,
        ...(typeof part.pageNumber === "number"
          ? { pageNumber: part.pageNumber }
          : {}),
      });
    }
  }

  const collection = getDB().collection<StoredDocumentChunk>(collectionName);

  // Re-ingesting a source replaces its chunks instead of duplicating them.
  // This also makes the queue worker idempotent: a retried or redelivered job
  // cleans up whatever a previous partial attempt left behind.
  await collection.deleteMany({ source: fileName });

  if (pending.length === 0) {
    return 0;
  }

  const vectors = await embeddings.embedDocuments(
    pending.map((chunk) => chunk.content),
  );

  if (vectors.length !== pending.length) {
    throw new Error(
      `Embedding count mismatch for "${fileName}": expected ${pending.length}, got ${vectors.length}.`,
    );
  }

  const createdAt = new Date();

  await collection.insertMany(
    pending.map((chunk, index) => ({
      content: chunk.content,
      embedding: vectors[index]!,
      source: fileName,
      sizeBytes,
      ...(typeof chunk.pageNumber === "number"
        ? { pageNumber: chunk.pageNumber }
        : {}),
      createdAt,
    })),
  );

  return pending.length;
};
