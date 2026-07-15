import type { Readable } from "node:stream";

import type { Message } from "@aws-sdk/client-sqs";

import { extractTextContent } from "./extract.ts";
import { ingestDocument } from "./ingest.ts";
import {
  getIngestJob,
  markIngestJobDone,
  markIngestJobFailed,
  markIngestJobProcessing,
} from "./ingestJobs.ts";
import { getOriginalFile, isS3Configured } from "../utils/s3.ts";
import {
  deleteIngestJobMessage,
  isSqsConfigured,
  receiveIngestJobMessages,
  type IngestJobMessage,
} from "../utils/sqs.ts";

// How long to back off after a failed poll so a persistent SQS problem (bad
// credentials, missing queue) doesn't turn into a hot loop.
const POLL_ERROR_BACKOFF_MS = 5000;

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

const processMessage = async (message: Message): Promise<void> => {
  if (!message.Body || !message.ReceiptHandle) return;

  let payload: IngestJobMessage;

  try {
    payload = JSON.parse(message.Body) as IngestJobMessage;
  } catch {
    // A message we can't even parse will never succeed — drop it instead of
    // letting it cycle through redeliveries.
    console.error("[ingest-worker] dropping malformed message:", message.Body);
    await deleteIngestJobMessage(message.ReceiptHandle);
    return;
  }

  console.log(
    `[ingest-worker] processing job "${payload.jobId}" for "${payload.source}"`,
  );

  const { jobId, source } = payload;
  const job = await getIngestJob(jobId);

  // Unknown (deleted) or already-completed jobs — e.g. a duplicate delivery
  // from SQS's at-least-once semantics — are dropped without reprocessing.
  if (!job || job.status === "done") {
    await deleteIngestJobMessage(message.ReceiptHandle);
    return;
  }

  try {
    await markIngestJobProcessing(jobId);

    const original = await getOriginalFile(source);

    if (!original) {
      throw new Error(`Original file for "${source}" was not found in S3.`);
    }

    const buffer = await streamToBuffer(original.body);
    const { text, pages } = await extractTextContent(
      buffer,
      source,
      original.contentType ?? job.contentType,
    );

    if (!text.trim()) {
      throw new Error(`No readable text found in "${source}".`);
    }

    const chunks = await ingestDocument(
      text.trim(),
      source,
      job.sizeBytes,
      pages,
    );

    await markIngestJobDone(jobId, chunks);
    await deleteIngestJobMessage(message.ReceiptHandle);

    console.log(`[ingest-worker] indexed "${source}" (${chunks} chunks)`);
  } catch (error) {
    // Leave the message on the queue: SQS redelivers it after the visibility
    // timeout and moves it to the dead-letter queue once maxReceiveCount is
    // exhausted. The job record keeps the last error for the library UI, and
    // ingestDocument's delete-then-insert makes the retry safe.
    console.error(`[ingest-worker] failed to ingest "${source}":`, error);

    const reason = error instanceof Error ? error.message : "Unknown error";

    await markIngestJobFailed(jobId, reason).catch((updateError) =>
      console.error(
        "[ingest-worker] failed to record job failure:",
        updateError,
      ),
    );
  }
};

// Long-polling consumer that runs inside the API process. Started after the
// DB connection is up (route/service code assumes getDB() works). Messages
// are processed one at a time so a burst of uploads drains at whatever pace
// the embeddings API allows instead of competing with itself.
export const startIngestWorker = (): void => {
  if (!isSqsConfigured() || !isS3Configured()) {
    console.log(
      "[ingest-worker] async ingestion disabled — set AWS_REGION, " +
        "S3_BUCKET_NAME and SQS_QUEUE_URL to enable it. Uploads are " +
        "ingested synchronously.",
    );
    return;
  }

  console.log("[ingest-worker] started — polling SQS for ingest jobs");

  void (async () => {
    while (true) {
      try {
        const messages = await receiveIngestJobMessages();

        console.log(`[ingest-worker] received ${messages.length} message(s)`);

        for (const message of messages) {
          await processMessage(message);
        }
      } catch (error) {
        console.error("[ingest-worker] poll failed:", error);
        await new Promise((resolve) =>
          setTimeout(resolve, POLL_ERROR_BACKOFF_MS),
        );
      }
    }
  })();
};
