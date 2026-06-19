import express, { type Request, type Response } from "express";

import { listLibraryDocuments, type LibraryDocument } from "../services/library.ts";
import { authMiddleware } from "../middleware/auth.ts";

const router = express.Router();

interface LibraryResponse {
  documents: LibraryDocument[];
  totalDocuments: number;
  totalChunks: number;
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

export default router;
