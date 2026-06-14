import { ChatOpenAI } from "@langchain/openai";

import { embeddings } from "../utils/embeddings.ts";

import { getDB } from "../db/mongo.ts";

const llm = new ChatOpenAI({
  model: "gpt-4.1-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

export const askQuestion = async (question: string) => {
  const queryVector = await embeddings.embedQuery(question);

  if (!process.env.COLLECTION_NAME) {
    throw new Error("COLLECTION_NAME environment variable is required");
  }

  const collection = getDB().collection(process.env.COLLECTION_NAME);

  const docs = await collection
    .aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector,
          numCandidates: 100,
          limit: 5,
        },
      },
    ])
    .toArray();

  const context = docs.map((d) => d.content).join("\n\n");

  const response = await llm.invoke(`
Answer using only the context.

Context:
${context}

Question:
${question}
`);

  return {
    answer: response.content,
    sources: docs.map((doc) => ({
      source: doc.source,
    })),
  };
};
