export type LibraryDocumentStatus =
  | "indexed"
  | "queued"
  | "processing"
  | "failed";

export interface LibraryDocument {
  source: string;
  chunks: number;
  sizeBytes: number;
  indexedAt: string;
  status: LibraryDocumentStatus;
  error?: string;
}

export interface LibraryResponse {
  documents: LibraryDocument[];
  totalDocuments: number;
  totalChunks: number;
}
