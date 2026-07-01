import express, { type Request, type Response } from "express";

import { suggestFollowups, type ChatTurn } from "../services/rag.ts";
import { sanitizeHistory } from "../utils/history.ts";
import { authMiddleware } from "../middleware/auth.ts";

const router = express.Router();

interface SuggestionsRequestBody {
  history?: ChatTurn[];
}

interface SuggestionsResponse {
  suggestions: string[];
}

interface ErrorResponse {
  error: string;
}

// Generate conversation-aware follow-up prompts for the chat input.
router.post(
  "/",
  authMiddleware,
  async (
    req: Request<Record<string, never>, unknown, SuggestionsRequestBody>,
    res: Response<SuggestionsResponse | ErrorResponse>,
  ): Promise<Response<SuggestionsResponse | ErrorResponse>> => {
    try {
      const conversation = sanitizeHistory(req.body?.history);
      const suggestions = await suggestFollowups(conversation);

      return res.json({ suggestions });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
