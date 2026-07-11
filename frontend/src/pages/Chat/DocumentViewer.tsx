import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { API_BASE_URL } from "../../config";
import { SourceRef } from "./types";

// Bundle the pdf.js worker with Vite instead of pulling it from a CDN.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface DocumentViewerProps {
  // The citation to show; null keeps the drawer closed.
  citation: SourceRef | null;
  onClose: () => void;
}

interface LoadedFile {
  kind: "pdf" | "text";
  // Object URL for PDFs (fed to react-pdf), raw text for text files.
  url?: string;
  text?: string;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const normalize = (value: string) =>
  value.replace(/\s+/g, " ").trim().toLowerCase();

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The citation snippet had its whitespace collapsed server-side, so an exact
// substring match against the raw file won't work. Match its words with
// flexible whitespace instead (capped so the pattern stays cheap).
const buildSnippetRegex = (snippet: string): RegExp | null => {
  const words = snippet.replace(/…$/, "").trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;

  try {
    return new RegExp(words.slice(0, 24).map(escapeRegExp).join("\\s+"), "i");
  } catch {
    return null;
  }
};

// Highlighted passage in a plain-text file, auto-scrolled into view.
const TextFileView: React.FC<{ text: string; snippet?: string }> = ({
  text,
  snippet,
}) => {
  const markRef = useRef<HTMLElement>(null);

  useEffect(() => {
    markRef.current?.scrollIntoView({ block: "center" });
  }, [text, snippet]);

  const regex = snippet ? buildSnippetRegex(snippet) : null;
  const match = regex ? text.match(regex) : null;

  let parts: React.ReactNode = text;
  if (match && typeof match.index === "number") {
    parts = (
      <>
        {text.slice(0, match.index)}
        <Box
          component="mark"
          ref={markRef}
          sx={{
            backgroundColor: "rgba(200, 169, 106, 0.35)",
            color: "#ece8df",
            borderRadius: "2px",
          }}
        >
          {match[0]}
        </Box>
        {text.slice(match.index + match[0].length)}
      </>
    );
  }

  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 3,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: '"Roboto Mono", monospace',
        fontSize: 13,
        lineHeight: 1.7,
        color: "#b8bdb5",
      }}
    >
      {parts}
    </Box>
  );
};

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  citation,
  onClose,
}) => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);

  const isNarrow = useMediaQuery("(max-width:760px)");
  const source = citation?.source ?? null;
  const citedPage = citation?.pageNumber;

  const snippetNorm = useMemo(
    () => (citation?.content ? normalize(citation.content.replace(/…$/, "")) : ""),
    [citation?.content],
  );

  // Fetch the original file (with the auth token) whenever the cited document
  // changes. Served as a blob so react-pdf can render it without the backend
  // needing token-in-URL support.
  useEffect(() => {
    if (!source) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    setFile(null);
    setError(null);
    setLoading(true);
    setNumPages(0);
    setPageNumber(citedPage ?? 1);

    const token = localStorage.getItem("token");

    fetch(`${API_BASE_URL}/library/file?source=${encodeURIComponent(source)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? "Failed to load the document");
        }

        const contentType = res.headers.get("content-type") ?? "";
        const lowerSource = source.toLowerCase();
        const isPdf = contentType.includes("pdf") || lowerSource.endsWith(".pdf");
        const isDocx =
          contentType.includes("wordprocessingml") ||
          lowerSource.endsWith(".docx");
        const blob = await res.blob();

        if (cancelled) return;

        if (isPdf) {
          objectUrl = URL.createObjectURL(blob);
          setFile({ kind: "pdf", url: objectUrl });
        } else if (isDocx) {
          // A .docx original is a zip, so it can't be shown as raw text.
          // Extract its text with the same library the backend uses at
          // ingest so the snippet highlight matches what was indexed;
          // imported lazily to keep mammoth out of the main bundle.
          const [{ default: mammoth }, arrayBuffer] = await Promise.all([
            import("mammoth"),
            blob.arrayBuffer(),
          ]);
          const result = await mammoth.extractRawText({ arrayBuffer });
          if (!cancelled) setFile({ kind: "text", text: result.value });
        } else {
          const text = await blob.text();
          if (!cancelled) setFile({ kind: "text", text });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load the document");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source, citedPage]);

  // Wrap text-layer items that appear in the cited snippet with <mark> so the
  // passage is visibly highlighted on top of the rendered page. Only applied
  // on the cited page (or everywhere when the citation has no page).
  const highlightRenderer = ({ str }: { str: string }): string => {
    const escaped = escapeHtml(str);
    if (!snippetNorm) return escaped;

    const item = normalize(str);
    if (item.length >= 4 && snippetNorm.includes(item)) {
      return `<mark>${escaped}</mark>`;
    }

    return escaped;
  };

  const shouldHighlightPage =
    typeof citedPage !== "number" || pageNumber === citedPage;

  const pageWidth = Math.min(
    680,
    (typeof window !== "undefined" ? window.innerWidth : 680) - 48,
  );

  return (
    <Drawer
      anchor="right"
      open={citation !== null}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: isNarrow ? "100vw" : 760,
            backgroundColor: "#0e1411",
            backgroundImage: "none",
            borderLeft: "1px solid #1a201c",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2.5,
            py: 2,
            borderBottom: "1px solid #1a201c",
            flex: "none",
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                fontSize: 14,
                color: "#ece8df",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {source}
            </Box>
            <Box
              sx={{
                fontSize: 11,
                color: "#6f7670",
                letterSpacing: "0.5px",
                mt: 0.25,
              }}
            >
              {typeof citedPage === "number"
                ? `cited passage on page ${citedPage}`
                : "cited passage highlighted"}
            </Box>
          </Box>

          {file?.kind === "pdf" && numPages > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "#6f7670",
                fontSize: 12,
              }}
            >
              <IconButton
                size="small"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                sx={{ color: "#8a9088" }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Box
                component="span"
                sx={{
                  whiteSpace: "nowrap",
                  color:
                    pageNumber === citedPage ? "#c8a96a" : "#8a9088",
                }}
              >
                {pageNumber} / {numPages}
              </Box>
              <IconButton
                size="small"
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                sx={{ color: "#8a9088" }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: "#6f7670", "&:hover": { color: "#ece8df" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems:
              loading || error ? "center" : "flex-start",
            py: loading || error ? 0 : 3,
            // Text-layer marks placed by highlightRenderer.
            "& .react-pdf__Page mark": {
              backgroundColor: "rgba(200, 169, 106, 0.45)",
              color: "transparent",
              borderRadius: "2px",
            },
          }}
        >
          {loading && <CircularProgress size={28} sx={{ color: "#c8a96a" }} />}

          {error && (
            <Box
              sx={{
                maxWidth: 420,
                px: 3,
                textAlign: "center",
                color: "#8a9088",
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              {error}
            </Box>
          )}

          {!loading && !error && file?.kind === "pdf" && file.url && (
            <Document
              file={file.url}
              onLoadSuccess={({ numPages: total }) => {
                setNumPages(total);
                setPageNumber((current) => Math.min(current, total));
              }}
              onLoadError={() => setError("Failed to render the PDF.")}
              loading={
                <CircularProgress size={28} sx={{ color: "#c8a96a" }} />
              }
            >
              <Page
                pageNumber={pageNumber}
                width={pageWidth}
                customTextRenderer={
                  shouldHighlightPage ? highlightRenderer : undefined
                }
              />
            </Document>
          )}

          {!loading && !error && file?.kind === "text" && (
            <Box sx={{ width: "100%" }}>
              <TextFileView
                text={file.text ?? ""}
                snippet={citation?.content}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};
