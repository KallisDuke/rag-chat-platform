import express, { type Request, type Response } from "express";
import { askQuestion } from "../services/rag.ts";
import type { ContentBlock } from "langchain";
import { authMiddleware } from "../middleware/auth.ts";

const router = express.Router();

interface QueryRequestBody {
  question: string;
}

interface QueryResponse {
  answer: string | (ContentBlock | ContentBlock.Text)[];
  sources: {
    source: any;
  }[];
}

interface ErrorResponse {
  error: string;
}

router.post(
  "/",
  authMiddleware,
  async (
    req: Request<Record<string, never>, QueryResponse, QueryRequestBody>,
    res: Response<QueryResponse | ErrorResponse>,
  ): Promise<Response<QueryResponse | ErrorResponse>> => {
    try {
      const { question } = req.body;

      const result = await askQuestion(question);

      console.log("Query result:", result);

      return res.json(result);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
