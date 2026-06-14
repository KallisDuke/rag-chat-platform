import { MongoClient, type Db } from "mongodb";

let db: Db | null = null;

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!mongoUri || !dbName) {
    throw new Error(
      "MONGODB_URI and DB_NAME environment variables are required",
    );
  }

  const client = new MongoClient(mongoUri);

  await client.connect();

  db = client.db(dbName);

  console.log("MongoDB Connected");
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error("Database has not been connected. Call connectDB first.");
  }

  return db;
};
