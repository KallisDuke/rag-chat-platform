import express, { type Request, type Response } from "express";

import {
  listLibraryDocuments,
  deleteLibraryDocument,
  type LibraryDocument,
} from "../services/library.ts";
import {
  isS3Configured,
  getOriginalFile,
  deleteOriginalFile,
} from "../utils/s3.ts";
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

// Stream the original uploaded file from S3 so the chat's citation viewer can
// render it, e.g. GET /library/file?source=report.pdf. Proxied through the
// backend (rather than handing out presigned URLs) so the bucket stays private
// and needs no CORS configuration, and access stays behind the app's JWT.
router.get(
  "/file",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const source =
        typeof req.query.source === "string" ? req.query.source.trim() : "";

      if (!source) {
        res.status(400).json({ error: "source query parameter is required" });
        return;
      }

      if (!isS3Configured()) {
        res.status(404).json({
          error:
            "Original file storage is not configured (set AWS_REGION and S3_BUCKET_NAME).",
        });
        return;
      }

      const file = await getOriginalFile(source);

      if (!file) {
        res.status(404).json({
          error:
            "No original file is stored for this document. Documents uploaded before file storage was enabled need to be re-uploaded.",
        });
        return;
      }

      res.setHeader(
        "Content-Type",
        file.contentType ?? "application/octet-stream",
      );
      if (typeof file.contentLength === "number") {
        res.setHeader("Content-Length", String(file.contentLength));
      }
      res.setHeader(
        "Content-Disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(source)}`,
      );

      file.body.pipe(res);
    } catch (error) {
      console.error(error);

      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } else {
        res.end();
      }
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

      // Best effort — the chunks are already gone, so a failure here only
      // leaves an orphaned original behind in the bucket.
      if (isS3Configured()) {
        deleteOriginalFile(source).catch((error) =>
          console.error(`Failed to delete original file for "${source}":`, error),
        );
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
