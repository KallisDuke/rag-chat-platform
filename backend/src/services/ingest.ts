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

  const collection = getDB().collection<StoredDocumentChunk>(collectionName);

  let totalChunks = 0;

  for (const part of parts) {
    const chunks = await splitter.createDocuments([part.text]);

    for (const chunk of chunks) {
      const vector = await embeddings.embedQuery(chunk.pageContent);

      await collection.insertOne({
        content: chunk.pageContent,
        embedding: vector,
        source: fileName,
        sizeBytes,
        ...(typeof part.pageNumber === "number"
          ? { pageNumber: part.pageNumber }
          : {}),
        createdAt: new Date(),
      });
    }

    totalChunks += chunks.length;
  }

  return totalChunks;
};
