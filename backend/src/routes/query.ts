import express, { type Request, type Response } from "express";
import { askQuestionStream, type ChatTurn } from "../services/rag.ts";
import { sanitizeHistory } from "../utils/history.ts";
import { authMiddleware } from "../middleware/auth.ts";

const router = express.Router();

interface QueryRequestBody {
  question: string;
  history?: ChatTurn[];
  topK?: number;
}

router.post(
  "/",
  authMiddleware,
  async (
    req: Request<Record<string, never>, unknown, QueryRequestBody>,
    res: Response,
  ): Promise<void> => {
    const { question, history, topK } = req.body ?? {};

    // Validate before opening the SSE stream so we can still return a clean
    // status code (once headers are flushed we can only emit stream events).
    if (typeof question !== "string" || question.trim() === "") {
      res.status(400).json({ error: "question is required" });
      return;
    }

    const conversation = sanitizeHistory(history);

    // Server-Sent Events: stream sources + answer tokens as they are produced
    // so the client renders incrementally instead of waiting for the full reply.
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      for await (const ev of askQuestionStream(question, conversation, topK)) {
        if (ev.type === "sources") {
          send("sources", ev.sources);
        } else {
          send("token", { text: ev.text });
        }
      }

      send("done", {});
    } catch (error) {
      console.error(error);
      send("error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      res.end();
    }
  },
);

export default router;
