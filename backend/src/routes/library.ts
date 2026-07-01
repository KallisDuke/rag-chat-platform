import express, { type Request, type Response } from "express";

import {
  listLibraryDocuments,
  deleteLibraryDocument,
  type LibraryDocument,
} from "../services/library.ts";
import { authMiddleware, adminMiddleware } from "../middleware/auth.ts";

const router = express.Router();

interface LibraryResponse {
  documents: LibraryDocument[];
  totalDocuments: number;
  totalChunks: number;
}

interface DeleteResponse {
  message: string;
  source: string;
  deletedChunks: number;
}

interface ErrorResponse {
  error: string;
}

router.get(
  "/",
  authMiddleware,
  async (
    req: Request,
    res: Response<LibraryResponse | ErrorResponse>,
  ): Promise<Response<LibraryResponse | ErrorResponse>> => {
    try {
      const documents = await listLibraryDocuments();
      const totalChunks = documents.reduce((total, doc) => total + doc.chunks, 0);

      return res.json({
        documents,
        totalDocuments: documents.length,
        totalChunks,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Admin only — remove a document and all of its chunks from the collection.
router.delete(
  "/",
  authMiddleware,
  adminMiddleware,
  async (
    req: Request<unknown, unknown, { source?: string }>,
    res: Response<DeleteResponse | ErrorResponse>,
  ): Promise<Response<DeleteResponse | ErrorResponse>> => {
    try {
      const source = req.body?.source?.trim();

      if (!source) {
        return res.status(400).json({ error: "source is required" });
      }

      const deletedChunks = await deleteLibraryDocument(source);

      if (deletedChunks === 0) {
        return res.status(404).json({ error: "Document not found" });
      }

      return res.json({
        message: "Document deleted",
        source,
        deletedChunks,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
