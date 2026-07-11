import type { Readable } from "node:stream";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Original uploads are stored in S3 so citations can deep-link into the real
// document. Storage is optional: without AWS_REGION + S3_BUCKET_NAME the app
// still ingests and answers normally — only the in-document viewer is off.
// Credentials come from the standard AWS chain (AWS_ACCESS_KEY_ID /
// AWS_SECRET_ACCESS_KEY env vars, shared config, or an instance role).
const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET_NAME;

let client: S3Client | null = null;

export const isS3Configured = (): boolean => Boolean(region && bucket);

const getClient = (): S3Client => {
  if (!region || !bucket) {
    throw new Error(
      "S3 is not configured — set AWS_REGION and S3_BUCKET_NAME.",
    );
  }

  if (!client) {
    client = new S3Client({ region });
  }

  return client;
};

// Objects are keyed by the same `source` name the library and chunk collection
// use, so a citation's `source` is enough to locate the original file.
const keyFor = (source: string) => `documents/${source}`;

export const uploadOriginalFile = async (
  source: string,
  body: Buffer,
  contentType: string,
): Promise<void> => {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: keyFor(source),
      Body: body,
      ContentType: contentType,
    }),
  );
};

export interface StoredOriginalFile {
  body: Readable;
  contentType?: string;
  contentLength?: number;
}

// Returns null when no original is stored under this source (e.g. documents
// ingested before S3 storage existed).
export const getOriginalFile = async (
  source: string,
): Promise<StoredOriginalFile | null> => {
  try {
    const result = await getClient().send(
      new GetObjectCommand({ Bucket: bucket, Key: keyFor(source) }),
    );

    if (!result.Body) return null;

    return {
      body: result.Body as Readable,
      ...(result.ContentType ? { contentType: result.ContentType } : {}),
      ...(typeof result.ContentLength === "number"
        ? { contentLength: result.ContentLength }
        : {}),
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "NoSuchKey" || error.name === "NotFound") {
        return null;
      }

      // Without s3:ListBucket on the bucket, S3 reports a *missing* object as
      // AccessDenied instead of NoSuchKey, so this can mean either a missing
      // file or a real permissions problem — point at the policy fix.
      if (error.name === "AccessDenied") {
        throw new Error(
          `S3 denied access to "${source}". If the file may simply not exist ` +
            "(e.g. it was uploaded before file storage was enabled), grant " +
            "s3:ListBucket on the bucket to the app's IAM user so S3 can " +
            "report missing files as 404 instead of AccessDenied.",
        );
      }
    }

    throw error;
  }
};

export const deleteOriginalFile = async (source: string): Promise<void> => {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: keyFor(source) }),
  );
};
