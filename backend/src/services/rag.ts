import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";

import { embeddings } from "../utils/embeddings.ts";

import { getDB } from "../db/mongo.ts";

const llm = new ChatOpenAI({
  model: "gpt-4.1-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface Citation {
  source: string;
  content: string;
  score: number;
}

// Only the most recent turns are replayed to the model — enough for follow-ups
// without blowing up the prompt (and cost) on long conversations.
const MAX_HISTORY_TURNS = 8;
const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;
const SNIPPET_MAX_CHARS = 320;

interface RetrievedDoc {
  content: string;
  source: string;
  score: number;
}

const clampTopK = (topK: number | undefined): number => {
  if (!Number.isFinite(topK)) return DEFAULT_TOP_K;

  return Math.min(Math.max(Math.trunc(topK as number), 1), MAX_TOP_K);
};

const snippet = (text: string): string => {
  const clean = text.replace(/\s+/g, " ").trim();

  return clean.length > SNIPPET_MAX_CHARS
    ? `${clean.slice(0, SNIPPET_MAX_CHARS)}…`
    : clean;
};

// Embed the query and pull the top matching chunks via Atlas vector search.
// Shared by both the streaming and non-streaming answer paths.
const retrieveContext = async (
  query: string,
  topK: number,
): Promise<RetrievedDoc[]> => {
  const queryVector = await embeddings.embedQuery(query);

  if (!process.env.COLLECTION_NAME) {
    throw new Error("COLLECTION_NAME environment variable is required");
  }

  const collection = getDB().collection(process.env.COLLECTION_NAME);

  const docs = await collection
    .aggregate<RetrievedDoc>([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector,
          numCandidates: Math.max(100, topK * 20),
          limit: topK,
        },
      },
      {
        // Feature 3: surface the chunk text + similarity score so the client
        // can show *why* an answer was given, not just the filename.
        $project: {
          _id: 0,
          content: 1,
          source: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ])
    .toArray();

  return docs;
};

// Message content from the model can be a plain string or an array of content
// blocks; flatten either into the text we want to stream/return.
const extractText = (content: unknown): string => {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block;

        if (block && typeof block === "object" && "text" in block) {
          const t = (block as { text?: unknown }).text;
          return typeof t === "string" ? t : "";
        }

        return "";
      })
      .join("");
  }

  return "";
};

// Feature 2: a follow-up like "tell me more about that" is meaningless to
// vector search on its own. Rewrite it into a standalone question using the
// prior turns so retrieval stays on-topic. Skipped when there is no history.
const condenseQuestion = async (
  question: string,
  history: ChatTurn[],
): Promise<string> => {
  if (history.length === 0) return question;

  const transcript = history
    .map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`)
    .join("\n");

  try {
    const response = await llm.invoke([
      new SystemMessage(
        "Given the conversation so far and a follow-up question, rephrase the " +
          "follow-up into a standalone question that can be understood without " +
          "the conversation. Preserve the user's intent and keep it concise. " +
          "Return only the rephrased question, with no preamble or quotes.",
      ),
      new HumanMessage(
        `Conversation:\n${transcript}\n\nFollow-up question: ${question}\n\nStandalone question:`,
      ),
    ]);

    const standalone = extractText(response.content).trim();

    return standalone || question;
  } catch (error) {
    // If condensing fails, fall back to the raw question rather than failing
    // the whole request.
    return question;
  }
};

// Build the chat messages: a context-grounded system prompt, the recent
// conversation turns (Feature 2), then the current question.
const buildMessages = (
  docs: RetrievedDoc[],
  question: string,
  history: ChatTurn[],
): BaseMessage[] => {
  // Number the context blocks so the model can cite them inline as [1], [2]…
  const context = docs
    .map((doc, i) => `[${i + 1}] (source: ${doc.source})\n${doc.content}`)
    .join("\n\n");

  const historyMessages: BaseMessage[] = history.map((t) =>
    t.role === "user" ? new HumanMessage(t.content) : new AIMessage(t.content),
  );

  return [
    new SystemMessage(
      "You are a helpful assistant. Answer the user's question using only the " +
        "context below. If the context does not contain the answer, say you " +
        "don't know rather than guessing. When you use a piece of context, " +
        "cite it inline with its bracketed number (e.g. [1]) matching the " +
        `context blocks.\n\nContext:\n${context}`,
    ),
    ...historyMessages,
    new HumanMessage(question),
  ];
};

const toCitations = (docs: RetrievedDoc[]): Citation[] =>
  docs.map((doc) => ({
    source: doc.source,
    content: snippet(doc.content),
    score: typeof doc.score === "number" ? doc.score : 0,
  }));

// Non-streaming answer — returns the full result once generation completes.
export const askQuestion = async (
  question: string,
  history: ChatTurn[] = [],
  topK?: number,
) => {
  const recentHistory = history.slice(-MAX_HISTORY_TURNS);
  const searchQuery = await condenseQuestion(question, recentHistory);
  const docs = await retrieveContext(searchQuery, clampTopK(topK));

  const response = await llm.invoke(
    buildMessages(docs, question, recentHistory),
  );

  return {
    answer: extractText(response.content),
    sources: toCitations(docs),
  };
};

// How many follow-up suggestions to generate.
const SUGGESTION_COUNT = 3;

// Pull a list of short prompts out of the model's reply. The model is asked for
// a JSON array, but we tolerate stray prose / bullet lists so a slightly
// malformed reply still yields usable suggestions instead of throwing.
const parseSuggestions = (text: string): string[] => {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed: unknown = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, SUGGESTION_COUNT);
      }
    } catch {
      // fall through to line-based parsing
    }
  }

  return text
    .split("\n")
    .map((line) => line.replace(/^[-*\d.)\]"\s]+/, "").replace(/"$/, "").trim())
    .filter(Boolean)
    .slice(0, SUGGESTION_COUNT);
};

// Suggest follow-up questions the user might ask next, grounded in the recent
// conversation. Returns [] for an empty conversation or on any failure, so the
// caller can fall back to static defaults.
export const suggestFollowups = async (
  history: ChatTurn[],
): Promise<string[]> => {
  const recentHistory = history.slice(-MAX_HISTORY_TURNS);
  if (recentHistory.length === 0) return [];

  const transcript = recentHistory
    .map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`)
    .join("\n");

  try {
    const response = await llm.invoke([
      new SystemMessage(
        `Suggest what the user might want to ask next. Given the conversation, ` +
          `propose ${SUGGESTION_COUNT} short, specific follow-up questions that ` +
          `build on it. Each must be self-contained, at most 8 words, phrased ` +
          `the way a user would type it (lowercase, no trailing punctuation, no ` +
          `numbering). Return ONLY a JSON array of ${SUGGESTION_COUNT} strings.`,
      ),
      new HumanMessage(`Conversation:\n${transcript}\n\nFollow-up suggestions:`),
    ]);

    return parseSuggestions(extractText(response.content));
  } catch (error) {
    console.error("[rag] suggestFollowups failed:", error);
    return [];
  }
};

export type StreamEvent =
  | { type: "sources"; sources: Citation[] }
  | { type: "token"; text: string };

// Streaming answer — yields the retrieved sources first (known right after the
// vector search), then the LLM's tokens as they are generated, so the route can
// forward each one to the client instead of waiting for the whole answer.
export async function* askQuestionStream(
  question: string,
  history: ChatTurn[] = [],
  topK?: number,
): AsyncGenerator<StreamEvent> {
  const recentHistory = history.slice(-MAX_HISTORY_TURNS);
  const searchQuery = await condenseQuestion(question, recentHistory);
  const docs = await retrieveContext(searchQuery, clampTopK(topK));

  yield { type: "sources", sources: toCitations(docs) };

  const stream = await llm.stream(buildMessages(docs, question, recentHistory));

  for await (const chunk of stream) {
    const text = extractText(chunk.content);

    if (!text) continue;

    yield { type: "token", text };
  }
}
