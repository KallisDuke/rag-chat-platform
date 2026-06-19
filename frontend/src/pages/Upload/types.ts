export interface LibraryDocument {
  source: string;
  chunks: number;
  sizeBytes: number;
  indexedAt: string;
}

export interface LibraryResponse {
  documents: LibraryDocument[];
  totalDocuments: number;
  totalChunks: number;
}
