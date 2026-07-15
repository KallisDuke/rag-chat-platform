import express, { type Request, type Response } from "express";
import multer from "multer";

import {
  extractTextContent,
  isSupportedFileType,
} from "../services/extract.ts";
import { ingestDocument } from "../services/ingest.ts";
import {
  createIngestJob,
  markIngestJobFailed,
} from "../services/ingestJobs.ts";
import { isS3Configured, uploadOriginalFile } from "../utils/s3.ts";
import { enqueueIngestJob, isSqsConfigured } from "../utils/sqs.ts";
import { authMiddleware } from "../middleware/auth.ts";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
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
  status: "indexed" | "queued";
}

interface UploadResponse {
  success: boolean;
  message: string;
  queued: boolean;
  documents: IngestedDocument[];
}

interface ErrorResponse {
  error: string;
}

// Async ingestion needs both pieces: S3 to hold the bytes after the HTTP
// request ends, and SQS to hand the work to the background worker. With
// either missing, uploads fall back to synchronous in-request ingestion.
const isAsyncIngestEnabled = (): boolean =>
  isS3Configured() && isSqsConfigured();

const getUploadedFiles = (req: Request): Express.Multer.File[] => {
  if (!req.files) {
    return [];
  }

  return Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
};

// Raw text submissions and multipart files are normalized into the same shape
// so both ingestion paths treat them identically.
interface PendingUpload {
  source: string;
  buffer: Buffer;
  contentType: string;
  sizeBytes: number;
}

const collectPendingUploads = (req: Request): PendingUpload[] => {
  const body = (req.body ?? {}) as UploadRequestBody;
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const uploads: PendingUpload[] = [];

  if (text) {
    const source = body.source?.trim() || "submitted-text.txt";
    const buffer = Buffer.from(text, "utf8");

    uploads.push({
      source,
      buffer,
      contentType: "text/plain; charset=utf-8",
      sizeBytes: buffer.byteLength,
    });
  }

  for (const file of getUploadedFiles(req)) {
    uploads.push({
      source: file.originalname,
      buffer: file.buffer,
      contentType: file.mimetype || "application/octet-stream",
      sizeBytes: file.size,
    });
  }

  return uploads;
};

// Queue path: store the original in S3, record a job, enqueue it, and return
// immediately — the worker does the parsing/embedding in the background.
const queueUpload = async (upload: PendingUpload): Promise<void> => {
  await uploadOriginalFile(upload.source, upload.buffer, upload.contentType);

  const jobId = await createIngestJob({
    source: upload.source,
    contentType: upload.contentType,
    sizeBytes: upload.sizeBytes,
  });

  try {
    await enqueueIngestJob({ jobId, source: upload.source });
  } catch (error) {
    // No message means no worker will ever pick this job up — mark it failed
    // so the library doesn't show a permanently "queued" document.
    await markIngestJobFailed(jobId, "Failed to enqueue ingest job").catch(
      () => {},
    );
    throw error;
  }
};

// Synchronous path (no S3/SQS): parse, embed, and index inside the request,
// exactly as before the queue existed.
const ingestUploadNow = async (upload: PendingUpload): Promise<number> => {
  const { text, pages } = await extractTextContent(
    upload.buffer,
    upload.source,
    upload.contentType,
  );

  if (!text.trim()) {
    throw new Error(`No readable text found in "${upload.source}".`);
  }

  // Keep a copy of the original bytes in S3 (keyed by source) so the chat's
  // citation viewer can open the real document later. Stored before ingesting
  // so a storage failure doesn't leave chunks pointing at a missing original.
  if (isS3Configured()) {
    await uploadOriginalFile(upload.source, upload.buffer, upload.contentType);
  }

  return ingestDocument(text.trim(), upload.source, upload.sizeBytes, pages);
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
      const uploads = collectPendingUploads(req);

      if (uploads.length === 0) {
        return res.status(400).json({
          error:
            'Provide "text" in the request body and/or upload one or more files.',
        });
      }

      // Reject unsupported files before anything is stored or queued so the
      // user hears about it immediately in both ingestion paths.
      for (const upload of uploads) {
        if (!isSupportedFileType(upload.source, upload.contentType)) {
          return res.status(400).json({
            error:
              `Unsupported file type for "${upload.source}". Upload a PDF, ` +
              "Word (.docx), or text-based file.",
          });
        }
      }

      const documents: IngestedDocument[] = [];

      if (isAsyncIngestEnabled()) {
        for (const upload of uploads) {
          await queueUpload(upload);
          documents.push({
            source: upload.source,
            chunks: 0,
            status: "queued",
          });
        }

        return res.status(202).json({
          success: true,
          queued: true,
          message: `Queued ${documents.length} document(s) for indexing`,
          documents,
        });
      }

      for (const upload of uploads) {
        const chunks = await ingestUploadNow(upload);
        documents.push({ source: upload.source, chunks, status: "indexed" });
      }

      const totalChunks = documents.reduce(
        (total, document) => total + document.chunks,
        0,
      );

      return res.json({
        success: true,
        queued: false,
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
