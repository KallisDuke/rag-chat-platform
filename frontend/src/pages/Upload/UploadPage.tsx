import React, { useCallback, useEffect, useState } from "react";
import { Box, CssBaseline, Typography } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { UploadTopBar } from "./UploadTopBar";
import { Dropzone } from "./Dropzone";
import { LibraryTable } from "./LibraryTable";
import { LibraryDocument, LibraryResponse } from "./types";
import { API_BASE_URL } from "../../config";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0e1411", paper: "#141a16" },
    primary: { main: "#c8a96a" },
    text: { primary: "#ece8df", secondary: "#8a9088" },
  },
  typography: {
    fontFamily: '"Roboto Mono", monospace',
  },
});

const API_BASE = API_BASE_URL;

// While any document is still queued/processing on the backend, the library
// is re-fetched at this interval so status chips update live.
const POLL_INTERVAL_MS = 3000;

export const UploadPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLibrary = useCallback(async (): Promise<LibraryResponse> => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}/library`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Failed to load library: ${response.statusText}`);
    return (await response.json()) as LibraryResponse;
  }, []);

  const applyLibrary = useCallback((data: LibraryResponse) => {
    setDocuments(data.documents);
    setTotalDocuments(data.totalDocuments);
    setTotalChunks(data.totalChunks);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLibrary();
        if (cancelled) return;
        applyLibrary(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load library");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, fetchLibrary, applyLibrary]);

  const hasPendingDocuments = documents.some(
    (doc) => doc.status === "queued" || doc.status === "processing",
  );

  // Silent background poll — no loading state, so rows don't flash while a
  // queued document works its way through the ingest worker.
  useEffect(() => {
    if (!hasPendingDocuments) return;

    let cancelled = false;
    const id = setInterval(async () => {
      try {
        const data = await fetchLibrary();
        if (!cancelled) applyLibrary(data);
      } catch {
        // Keep showing the last good data; the next tick retries.
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [hasPendingDocuments, fetchLibrary, applyLibrary]);

  const handleDelete = async (source: string) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}/library`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ source }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? `Failed to delete: ${response.statusText}`);
    }

    setRefreshKey((k) => k + 1);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        sx={{
          display: "grid",
          gridTemplateRows: "72px 1fr",
          height: "100dvh",
          width: "100%",
          backgroundColor: "#0e1411",
          color: "#ece8df",
        }}
      >
        <UploadTopBar totalDocuments={totalDocuments} totalChunks={totalChunks} />

        <Box sx={{ overflowY: "auto" }}>
          <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2.5, md: 5 }, pt: { xs: 4, md: 6 }, pb: { xs: 6, md: 10 } }}>
            <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mb: 4 }}>
              <Box>
                <Typography sx={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "#6f7670", mb: 1 }}>
                  ◐ Knowledge base
                </Typography>
                <Typography sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 500, letterSpacing: "-0.5px", color: "#f5f1e8" }}>
                  Upload documents
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#8a9088", mt: 1, lineHeight: 1.5, maxWidth: 560 }}>
                  Files are chunked, embedded, and indexed. Once indexed, they become available to retrieval across all your conversations.
                </Typography>
              </Box>
            </Box>

            <Dropzone onUploaded={() => setRefreshKey((k) => k + 1)} />

            <LibraryTable
              documents={documents}
              totalDocuments={totalDocuments}
              loading={loading}
              error={error}
              onDelete={handleDelete}
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
