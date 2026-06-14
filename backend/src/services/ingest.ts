import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { embeddings } from "../utils/embeddings.ts";

import { getDB } from "../db/mongo.ts";

interface StoredDocumentChunk {
  content: string;
  embedding: number[];
  source: string;
  createdAt: Date;
}

export const ingestDocument = async (
  text: string,
  fileName: string,
): Promise<number> => {
  const collectionName = process.env.COLLECTION_NAME;

  if (!collectionName) {
    throw new Error("COLLECTION_NAME environment variable is required");
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.createDocuments([text]);

  const collection = getDB().collection<StoredDocumentChunk>(collectionName);

  for (const chunk of chunks) {
    const vector = await embeddings.embedQuery(chunk.pageContent);

    await collection.insertOne({
      content: chunk.pageContent,
      embedding: vector,
      source: fileName,
      createdAt: new Date(),
    });
  }

  return chunks.length;
};
