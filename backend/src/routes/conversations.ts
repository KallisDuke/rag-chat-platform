import express, { type Request, type Response } from "express";

import {
  listConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  type ConversationMessage,
} from "../services/conversations.ts";
import { authMiddleware } from "../middleware/auth.ts";

const router = express.Router();

// Map a service error to an HTTP status. "not found" -> 404, bad id -> 400.
const statusForError = (message: string): number => {
  if (message.includes("Invalid")) return 400;
  if (message.includes("not found")) return 404;
  return 500;
};

const fail = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  return res.status(statusForError(message)).json({ error: message });
};

// List conversations for a user, e.g. GET /conversations?email=foo@bar.com
router.get(
  "/",
  authMiddleware,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const email = req.query.email;

      if (typeof email !== "string" || !email.trim()) {
        return res
          .status(400)
          .json({ error: "email query parameter is required" });
      }

      const conversations = await listConversations(email);

      return res.json({ conversations });
    } catch (error) {
      return fail(res, error);
    }
  },
);

// Create a new conversation.
router.post(
  "/",
  authMiddleware,
  async (
    req: Request<
      Record<string, never>,
      unknown,
      { email?: string; title?: string; messages?: ConversationMessage[] }
    >,
    res: Response,
  ): Promise<Response> => {
    try {
      const { email, title, messages } = req.body ?? {};

      if (!email?.trim()) {
        return res.status(400).json({ error: "email is required" });
      }

      const conversation = await createConversation({ email, title, messages });

      return res.status(201).json({ conversation });
    } catch (error) {
      return fail(res, error);
    }
  },
);

// Update an existing conversation (title and/or messages).
router.put(
  "/:id",
  authMiddleware,
  async (
    req: Request<
      { id: string },
      unknown,
      { title?: string; messages?: ConversationMessage[] }
    >,
    res: Response,
  ): Promise<Response> => {
    try {
      const { title, messages } = req.body ?? {};

      const conversation = await updateConversation(req.params.id, {
        title,
        messages,
      });

      return res.json({ conversation });
    } catch (error) {
      return fail(res, error);
    }
  },
);

// Delete a particular conversation.
router.delete(
  "/:id",
  authMiddleware,
  async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
    try {
      await deleteConversation(req.params.id);

      return res.json({ message: "Conversation deleted" });
    } catch (error) {
      return fail(res, error);
    }
  },
);

export default router;
