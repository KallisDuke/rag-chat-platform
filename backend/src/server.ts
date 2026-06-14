import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db/mongo.ts";
import uploadRouter from "./routes/upload.ts";
import queryRouter from "./routes/query.ts";
import loginRouter from "./routes/auth.ts";

dotenv.config();

const app = express();
const port = process.env.PORT ?? "3000";

app.use(express.json());
app.use(cors());

app.use("/upload", uploadRouter);
app.use("/query", queryRouter);
app.use("/login", loginRouter);

app.get("/health", (req, res) => {
  res.json({ message: "Health check passed", status: "OK" });
});

const start = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
};

start().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
