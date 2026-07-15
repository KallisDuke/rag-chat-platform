import path from "node:path";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import type { PageText } from "./ingest.ts";

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

export interface ExtractedContent {
  text: string;
  // Per-page text for PDFs, so chunks can record their page for citation
  // deep-linking. Absent for plain-text files.
  pages?: PageText[];
}

// Cheap upfront check so the upload route can reject unsupported files before
// storing anything, in both the synchronous and queued ingestion paths.
export const isSupportedFileType = (
  fileName: string,
  mimeType: string,
): boolean => {
  const extension = path.extname(fileName).toLowerCase();

  return (
    mimeType === "application/pdf" ||
    extension === ".pdf" ||
    mimeType === DOCX_MIME_TYPE ||
    extension === ".docx" ||
    mimeType.startsWith("text/") ||
    textFileExtensions.has(extension)
  );
};

// Shared by the upload route (synchronous fallback) and the SQS ingest worker,
// which re-extracts from the original bytes fetched back out of S3.
export const extractTextContent = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<ExtractedContent> => {
  const extension = path.extname(fileName).toLowerCase();

  if (mimeType === "application/pdf" || extension === ".pdf") {
    const parser = new PDFParse({ data: buffer });

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

  if (mimeType === DOCX_MIME_TYPE || extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer });

    return { text: result.value };
  }

  if (mimeType.startsWith("text/") || textFileExtensions.has(extension)) {
    return { text: buffer.toString("utf8") };
  }

  throw new Error(
    `Unsupported file type for "${fileName}". Upload a PDF, Word (.docx), or text-based file.`,
  );
};
