import { ObjectId } from "mongodb";

import { getDB } from "../db/mongo.ts";
import { generatePassword } from "../utils/password.ts";

export type AccessRequestStatus = "pending" | "approved" | "rejected";

export interface AccessRequest {
  _id: string;
  fullName: string;
  email: string;
  useCase: string;
  status: AccessRequestStatus;
  createdAt: Date;
  approvedAt: Date | null;
}

const getCollectionName = () =>
  process.env.ACCESS_REQUEST_COLLECTION_NAME ?? "rag_access_requests";

const getCollection = () => getDB().collection(getCollectionName());

export const createAccessRequest = async (input: {
  fullName: string;
  email: string;
  useCase?: string;
}): Promise<void> => {
  await getCollection().insertOne({
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    useCase: input.useCase?.trim() ?? "",
    status: "pending",
    createdAt: new Date(),
    approvedAt: null,
  });
};

export const listAccessRequests = async (): Promise<AccessRequest[]> => {
  const rows = await getCollection().find({}).sort({ createdAt: -1 }).toArray();

  return rows.map((row) => ({
    _id: row._id.toString(),
    fullName: row.fullName,
    email: row.email,
    useCase: row.useCase ?? "",
    status: row.status,
    createdAt: row.createdAt,
    approvedAt: row.approvedAt ?? null,
  }));
};

export const approveAccessRequest = async (
  id: string,
): Promise<{ email: string; password: string }> => {
  const userCollectionName = process.env.USER_COLLECTION_NAME;

  if (!userCollectionName) {
    throw new Error("USER_COLLECTION_NAME environment variable is not set");
  }

  const requests = getCollection();
  const request = await requests.findOne({ _id: new ObjectId(id) });

  if (!request) {
    throw new Error("Access request not found");
  }

  if (request.status === "approved") {
    throw new Error("Access request has already been approved");
  }

  const email = request.email as string;
  const password = generatePassword();

  // Plaintext password to match the existing exact-match login in auth.ts.
  // $setOnInsert keeps an existing user's role (e.g. the admin) intact.
  const users = getDB().collection(userCollectionName);
  await users.updateOne(
    { email },
    {
      $set: { email, password },
      $setOnInsert: { role: "user", createdAt: new Date() },
    },
    { upsert: true },
  );

  await requests.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "approved", approvedAt: new Date() } },
  );

  return { email, password };
};

export const rejectAccessRequest = async (id: string): Promise<void> => {
  const result = await getCollection().updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "rejected" } },
  );

  if (result.matchedCount === 0) {
    throw new Error("Access request not found");
  }
};
