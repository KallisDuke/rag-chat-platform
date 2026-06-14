import path from "node:path";

import express, { type Request, type Response } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";

import { ingestDocument } from "../services/ingest.ts";
import { authMiddleware } from "../middleware/auth.ts";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

interface UploadRequestBody {
  source?: string;
  text?: string;
}

interface IngestedDocument {
  source: string;
  chunks: number;
}

interface UploadResponse {
  success: boolean;
  message: string;
  documents: IngestedDocument[];
}

interface ErrorResponse {
  error: string;
}

const textFileExtensions = new Set([
  ".csv",
  ".html",
  ".json",
  ".log",
  ".md",
  ".rtf",
  ".text",
  ".txt",
  ".xml",
]);

const getUploadedFiles = (req: Request): Express.Multer.File[] => {
  if (!req.files) {
    return [];
  }

  return Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
};

const extractFileText = async (file: Express.Multer.File): Promise<string> => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.mimetype === "application/pdf" || extension === ".pdf") {
    const parser = new PDFParse({ data: file.buffer });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (file.mimetype.startsWith("text/") || textFileExtensions.has(extension)) {
    return file.buffer.toString("utf8");
  }

  throw new Error(
    `Unsupported file type for "${file.originalname}". Upload a PDF or text-based file.`,
  );
};

router.post(
  "/",
  authMiddleware,
  upload.any(),
  async (
    req: Request<
      Record<string, never>,
      UploadResponse | ErrorResponse,
      UploadRequestBody
    >,
    res: Response<UploadResponse | ErrorResponse>,
  ): Promise<Response<UploadResponse | ErrorResponse>> => {
    try {
      const documents: IngestedDocument[] = [];
      const body = req.body ?? {};
      const text = typeof body.text === "string" ? body.text.trim() : "";
      const files = getUploadedFiles(req);

      if (!text && files.length === 0) {
        return res.status(400).json({
          error:
            'Provide "text" in the request body and/or upload one or more files.',
        });
      }

      if (text) {
        const source = body.source?.trim() || "submitted-text.txt";
        const chunks = await ingestDocument(text, source);
        documents.push({ source, chunks });
      }

      for (const file of files) {
        const fileText = (await extractFileText(file)).trim();

        if (!fileText) {
          throw new Error(`No readable text found in "${file.originalname}".`);
        }

        const chunks = await ingestDocument(fileText, file.originalname);
        documents.push({ source: file.originalname, chunks });
      }

      const totalChunks = documents.reduce(
        (total, document) => total + document.chunks,
        0,
      );

      return res.json({
        success: true,
        message: `Ingested ${documents.length} document(s) in ${totalChunks} chunk(s)`,
        documents,
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
