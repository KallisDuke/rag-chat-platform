import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db/mongo.ts";
import uploadRouter from "./routes/upload.ts";
import queryRouter from "./routes/query.ts";
import suggestionsRouter from "./routes/suggestions.ts";
import loginRouter from "./routes/auth.ts";
import libraryRouter from "./routes/library.ts";
import accessRequestsRouter from "./routes/accessRequests.ts";
import conversationsRouter from "./routes/conversations.ts";

const app = express();
const port = process.env.PORT ?? "3000";

app.use(express.json());
app.use(cors());

app.use("/upload", uploadRouter);
app.use("/query", queryRouter);
app.use("/suggestions", suggestionsRouter);
app.use("/login", loginRouter);
app.use("/library", libraryRouter);
app.use("/access-requests", accessRequestsRouter);
app.use("/conversations", conversationsRouter);

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
