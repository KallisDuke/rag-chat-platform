import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  type Message,
} from "@aws-sdk/client-sqs";

// Queue for background document ingestion. Like S3, this is optional: without
// AWS_REGION + SQS_QUEUE_URL uploads fall back to synchronous in-request
// ingestion. Credentials come from the standard AWS chain (AWS_ACCESS_KEY_ID /
// AWS_SECRET_ACCESS_KEY env vars, shared config, or an instance role).
const region = process.env.AWS_REGION;
const queueUrl = process.env.SQS_QUEUE_URL;

let client: SQSClient | null = null;

export const isSqsConfigured = (): boolean => Boolean(region && queueUrl);

const getClient = (): SQSClient => {
  if (!region || !queueUrl) {
    throw new Error(
      "SQS is not configured — set AWS_REGION and SQS_QUEUE_URL.",
    );
  }

  if (!client) {
    client = new SQSClient({ region });
  }

  return client;
};

// The message carries only identifiers; the worker reloads the job record from
// Mongo and the original bytes from S3, so a redelivered message always acts
// on current state.
export interface IngestJobMessage {
  jobId: string;
  source: string;
}

export const enqueueIngestJob = async (
  message: IngestJobMessage,
): Promise<void> => {
  await getClient().send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    }),
  );
};

// Long polling (20s) keeps an idle worker nearly free while still picking up
// new messages the moment they arrive.
export const receiveIngestJobMessages = async (): Promise<Message[]> => {
  const result = await getClient().send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20,
    }),
  );

  return result.Messages ?? [];
};

export const deleteIngestJobMessage = async (
  receiptHandle: string,
): Promise<void> => {
  await getClient().send(
    new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    }),
  );
};
