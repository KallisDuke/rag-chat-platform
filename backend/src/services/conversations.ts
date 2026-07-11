import { ObjectId } from "mongodb";

import { getDB } from "../db/mongo.ts";

export interface ConversationMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string | Date;
  files?: { name: string; size: number; type: string }[];
  sources?: {
    source: string;
    content?: string;
    score?: number;
    pageNumber?: number;
  }[];
  durationMs?: number;
}

export interface Conversation {
  id: string;
  email: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const getCollectionName = () =>
  process.env.CONVERSATION_COLLECTION_NAME ?? "rag_conversations";

const getCollection = () => getDB().collection(getCollectionName());

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const serialize = (row: any): Conversation => ({
  id: row._id.toString(),
  email: row.email,
  title: row.title,
  messages: row.messages ?? [],
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const listConversations = async (
  email: string,
): Promise<Conversation[]> => {
  const rows = await getCollection()
    .find({ email: normalizeEmail(email) })
    .sort({ updatedAt: -1 })
    .toArray();

  return rows.map(serialize);
};

export const createConversation = async (input: {
  email: string;
  title?: string | undefined;
  messages?: ConversationMessage[] | undefined;
}): Promise<Conversation> => {
  const now = new Date();
  const doc = {
    email: normalizeEmail(input.email),
    title: input.title?.trim() || "New conversation",
    messages: input.messages ?? [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await getCollection().insertOne(doc);

  return { id: result.insertedId.toString(), ...doc };
};

export const updateConversation = async (
  id: string,
  input: {
    title?: string | undefined;
    messages?: ConversationMessage[] | undefined;
  },
): Promise<Conversation> => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid conversation id");
  }

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) set.title = input.title;
  if (input.messages !== undefined) set.messages = input.messages;

  // mongodb v7 returns the updated document directly (no `.value` wrapper).
  const updated = await getCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: set },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw new Error("Conversation not found");
  }

  return serialize(updated);
};

export const deleteConversation = async (id: string): Promise<void> => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid conversation id");
  }

  const result = await getCollection().deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    throw new Error("Conversation not found");
  }
};
