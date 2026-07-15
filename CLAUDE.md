# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Task completion

Once you finish implementing the current task, say "Task is completed, Kallis!".

## Project overview

A RAG (Retrieval-Augmented Generation) chat application with two independent npm projects in one repo:

- `backend/` — Express 5 + TypeScript API (ESM, run directly via `tsx`, no build step for dev)
- `frontend/` — React 19 + Vite + MUI single-page app

Both are wired together via `docker-compose.yml` for local development.

## Commands

All commands are run from inside `backend/` or `frontend/` respectively (no root `package.json`).

### Backend (`backend/`)

- `npm run dev` — start the API with `tsx watch src/server.ts` (auto-restarts on change)
- `npm run dev:worker` — start the SQS ingest worker standalone (`tsx watch src/worker.ts`); requires the S3+SQS env vars and pairs with `INGEST_WORKER=off` on the API
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — not implemented (placeholder script that exits with an error)
- No lint script/config exists in this project.

### Frontend (`frontend/`)

- `npm run dev` — start Vite dev server
- `npm run build` — `tsc -b && vite build`
- `npm run typecheck` — `tsc -b --pretty false`
- `npm run preview` — preview the production build
- No lint script/config exists in this project.

### Docker

- `docker-compose up` from the repo root runs both services together: frontend on `:5173`, backend on `:3000`. Both bind-mount source for live reload and exclude `node_modules` via an anonymous volume. File watching uses polling (`WATCHPACK_POLLING`/`CHOKIDAR_USEPOLLING` for backend, `usePolling` in `vite.config.ts` for frontend) since this is developed on Windows with bind-mounted volumes.

### Backend environment variables

The backend reads from `backend/.env` (no `.env.example` checked in). Required keys: `MONGODB_URI`, `DB_NAME`, `COLLECTION_NAME`, `USER_COLLECTION_NAME`, `JWT_SECRET`, `OPENAI_API_KEY`, optionally `PORT` (defaults to 3000).

Optional S3 keys for original-file storage (powers the chat citation viewer): `AWS_REGION`, `S3_BUCKET_NAME`, plus credentials via the standard AWS chain (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`). Without them the app works normally but originals aren't stored and `GET /library/file` returns 404 (`src/utils/s3.ts` — `isS3Configured()`).

Optional `SQS_QUEUE_URL` (with `AWS_REGION` + the S3 keys above) enables asynchronous ingestion: uploads are stored in S3, recorded as jobs, and queued to SQS; a background worker does the parsing/embedding/indexing. By default the worker runs inside the API process; set `INGEST_WORKER=off` on the API and run `src/worker.ts` as its own process (`npm run dev:worker` locally, `Dockerfile.worker` in production) to consume the queue from a separate, independently sized deployment. Without SQS (or without S3), uploads are ingested synchronously inside the request as before. The queue should be a standard queue with a generous visibility timeout (~15 min) and a dead-letter queue redrive policy (`maxReceiveCount` ~3); the IAM user needs `sqs:SendMessage`, `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes`. Job records live in `INGEST_JOB_COLLECTION_NAME` (defaults to `rag_ingest_jobs`).

## Architecture

### Backend: RAG pipeline over MongoDB Atlas Vector Search

- `src/server.ts` — Express app entry point. Mounts `/upload`, `/query`, `/login`, and `/health`. Connects to MongoDB before binding the port.
- `src/db/mongo.ts` — single shared `Db` instance via `connectDB()`/`getDB()`. `getDB()` throws if called before `connectDB()` resolves, so route/service code assumes the connection is already established.
- `src/utils/embeddings.ts` — single shared `OpenAIEmbeddings` instance (`text-embedding-3-small`), imported by both ingest and query paths to keep embedding behavior consistent.
- `src/services/ingest.ts` — chunks input text with `RecursiveCharacterTextSplitter` (1000/200 overlap), embeds all chunks in one batched `embedDocuments` call, and bulk-inserts one Mongo document per chunk (`content`, `embedding`, `source`, `sizeBytes`, optional `pageNumber`, `createdAt`) into `COLLECTION_NAME` via `insertMany`. PDFs are chunked per page so each chunk records its page for citation deep-linking. Re-ingesting a source first deletes its existing chunks (replace, not append) — this is what makes queued retries idempotent.
- `src/services/extract.ts` — shared text extraction (PDF via `pdf-parse`, `.docx` via `mammoth`, plaintext-like extensions as UTF-8) used by both the upload route's synchronous path and the ingest worker.
- `src/utils/s3.ts` — optional S3 storage for original uploads, keyed `documents/<source>`. Uploads store the original before ingesting; `GET /library/file?source=...` streams it back (proxied through the backend so the bucket stays private, no CORS needed); deleting a library document also deletes the original (best effort).
- Async ingestion (active when S3 **and** SQS are configured): `src/utils/sqs.ts` (queue client mirroring `s3.ts`'s optional-config pattern), `src/services/ingestJobs.ts` (job records: `queued` → `processing` → `done`/`failed`, latest-job-per-source drives library status), and `src/services/ingestWorker.ts` (long-polling SQS consumer; fetches the original from S3, extracts, ingests, marks the job, deletes the message; on failure it leaves the message for SQS redelivery/DLQ and records the error on the job). The consumer starts from `server.ts` after `connectDB()` unless `INGEST_WORKER=off`, or runs standalone via `src/worker.ts` (fails fast if S3/SQS are unconfigured; built by `Dockerfile.worker` for isolated deployment).
- `src/services/rag.ts` — embeds the incoming question, runs a `$vectorSearch` aggregation against the same collection (index name `vector_index`, must exist in Atlas), concatenates retrieved chunk content into a context block, and asks `ChatOpenAI` (`gpt-4.1-mini`) to answer using only that context. Returns `{ answer, sources }`.
- `src/routes/upload.ts` — accepts either raw `text` in the body and/or multipart files (`multer`, memory storage, 10MB/10-file limit); unsupported types are rejected up front via `isSupportedFileType`. With S3+SQS configured it stores originals, creates jobs, enqueues them, and returns `202` with `status: "queued"` per document; otherwise it ingests synchronously in-request and returns per-source chunk counts.
- `src/services/library.ts` — `GET /library` merges the chunk aggregation with the latest ingest job per source, so each document carries a `status` (`indexed`/`queued`/`processing`/`failed`, plus `error` when failed). Deleting a document removes its chunks and its job records.
- `src/routes/query.ts` — thin wrapper around `askQuestion`, protected by `authMiddleware`.
- `src/routes/auth.ts` — `/login` looks up a user by **exact email+password match** in `USER_COLLECTION_NAME` (no hashing) and issues a 1-hour JWT containing `userId`/`email`.
- `src/middleware/auth.ts` — validates `Authorization: Bearer <token>` against `JWT_SECRET` and attaches `req.user`.

Both `upload` and `query` require a valid JWT; `login` is the only unauthenticated route.

### Frontend: route-gated SPA, no backend-synced chat state

- `src/App.tsx` — routes: `/login` (public), `/chat` and `/upload` (wrapped in `ProtectedRoute`). `ProtectedRoute` only checks `isTokenValid()` (decodes the JWT client-side and compares `exp`); it does not verify the signature.
- `src/utils.ts` — `isTokenValid()` reads `token` from `localStorage`.
- API base URL is hardcoded as `http://localhost:3000` in each call site (`LoginForm.tsx`, `ChatPage.tsx`, `UploadPage.tsx`) rather than centralized — there is no shared API client/config module yet.
- `src/pages/Chat/` — `ChatPage` owns all chat state (`chats`, `activeChat`) in component state only; chats/messages are not persisted anywhere (lost on refresh) and are not loaded from the backend. Sending a message optimistically appends a `loading-*` placeholder message, calls `POST /query`, then replaces the placeholder with the real answer or an error message.
- `src/pages/UploadPage.tsx` — independent file-picker UI that posts selected files to `POST /upload` as `multipart/form-data` under the `files` field; unrelated to the chat attachment UI in `ChatInput.tsx` (which currently reads files as base64 client-side but never sends them to an endpoint — attachments in chat are not wired to the backend).
- Theming: `src/theme/theme.ts` defines a light MUI theme applied globally in `main.tsx`, but `ChatPage.tsx` defines and applies its own dark `createTheme` locally, overriding the global theme for that page only.
