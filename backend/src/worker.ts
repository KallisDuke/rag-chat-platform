import "dotenv/config";

import { connectDB } from "./db/mongo.ts";
import { startIngestWorker } from "./services/ingestWorker.ts";
import { isS3Configured } from "./utils/s3.ts";
import { isSqsConfigured } from "./utils/sqs.ts";

// Dedicated entrypoint for the SQS ingest worker, so it can run and be
// deployed separately from the API (see Dockerfile.worker). Run the API with
// INGEST_WORKER=off so the two processes don't both consume the queue.
const start = async () => {
  // Inside the API the worker silently no-ops without S3/SQS, but a dedicated
  // worker process with missing config would just sit idle forever — fail
  // fast so the misconfiguration is visible.
  if (!isSqsConfigured() || !isS3Configured()) {
    throw new Error(
      "Ingest worker requires AWS_REGION, S3_BUCKET_NAME and SQS_QUEUE_URL.",
    );
  }

  await connectDB();

  startIngestWorker();
};

start().catch((error: unknown) => {
  console.error("Failed to start ingest worker:", error);
  process.exit(1);
});
