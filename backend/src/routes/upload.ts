import path from "node:path";

import express, { type Request, type Response } from "express";
import mammoth from "mammoth";
import multer from "multer";
import { PDFParse } from "pdf-parse";

import { ingestDocument, type PageText } from "../services/ingest.ts";
import { isS3Configured, uploadOriginalFile } from "../utils/s3.ts";
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

interface ExtractedContent {
  text: string;
  // Per-page text for PDFs, so chunks can record their page for citation
  // deep-linking. Absent for plain-text files.
  pages?: PageText[];
}

const extractFileContent = async (
  file: Express.Multer.File,
): Promise<ExtractedContent> => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.mimetype === "application/pdf" || extension === ".pdf") {
    const parser = new PDFParse({ data: file.buffer });

    try {
      const result = await parser.getText();

      return {
        text: result.text,
        pages: result.pages.map((page) => ({
          pageNumber: page.num,
          text: page.text,
        })),
      };
    } finally {
      await parser.destroy();
    }
  }

  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });

    return { text: result.value };
  }

  if (file.mimetype.startsWith("text/") || textFileExtensions.has(extension)) {
    return { text: file.buffer.toString("utf8") };
  }

  throw new Error(
    `Unsupported file type for "${file.originalname}". Upload a PDF, Word (.docx), or text-based file.`,
  );
};

// Keep a copy of the original bytes in S3 (keyed by source) so the chat's
// citation viewer can open the real document later. Stored before ingesting so
// a storage failure doesn't leave chunks pointing at a missing original.
const storeOriginal = async (
  source: string,
  body: Buffer,
  contentType: string,
): Promise<void> => {
  if (!isS3Configured()) return;

  await uploadOriginalFile(source, body, contentType);
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
        const buffer = Buffer.from(text, "utf8");

        await storeOriginal(source, buffer, "text/plain; charset=utf-8");

        const chunks = await ingestDocument(text, source, buffer.byteLength);
        documents.push({ source, chunks });
      }

      for (const file of files) {
        const { text: fileText, pages } = await extractFileContent(file);

        if (!fileText.trim()) {
          throw new Error(`No readable text found in "${file.originalname}".`);
        }

        await storeOriginal(
          file.originalname,
          file.buffer,
          file.mimetype || "application/octet-stream",
        );

        const chunks = await ingestDocument(
          fileText.trim(),
          file.originalname,
          file.size,
          pages,
        );
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
