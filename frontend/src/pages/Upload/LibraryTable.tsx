import React, { useMemo, useState } from "react";
import { Box, InputBase, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { LibraryDocument } from "./types";

const PAGE_SIZE = 8;

const formatFileSize = (bytes: number) => {
  if (!bytes) return "—";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const formatIndexedDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const fileTypeLabel = (source: string) => {
  const dot = source.lastIndexOf(".");
  if (dot === -1) return "DOC";
  return source.slice(dot + 1).toUpperCase().slice(0, 4);
};

const gridTemplateColumns = "40px 1.6fr 0.7fr 0.7fr 60px";

interface LibraryTableProps {
  documents: LibraryDocument[];
  totalDocuments: number;
  loading: boolean;
  error: string | null;
}

export const LibraryTable: React.FC<LibraryTableProps> = ({
  documents,
  totalDocuments,
  loading,
  error,
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      search.trim()
        ? documents.filter((doc) => doc.source.toLowerCase().includes(search.trim().toLowerCase()))
        : documents,
    [documents, search],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.75 }}>
          <Typography sx={{ fontSize: 17, fontWeight: 600, letterSpacing: "0.3px", color: "#ece8df" }}>
            Library
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#6f7670", letterSpacing: "0.4px" }}>
            {totalDocuments.toLocaleString()} document{totalDocuments === 1 ? "" : "s"} indexed
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.25 }}>
          <Box sx={{ position: "relative", display: "flex", alignItems: "center" }}>
            <SearchIcon sx={{ position: "absolute", left: 10, fontSize: 16, color: "#6f7670" }} />
            <InputBase
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="search library"
              sx={{
                height: 36,
                pl: 4.25,
                pr: 1.5,
                width: 240,
                backgroundColor: "#141a16",
                border: "1px solid #1f2521",
                borderRadius: "5px",
                fontSize: 13,
                color: "#ece8df",
                "&.Mui-focused": { borderColor: "#2a302c" },
              }}
            />
          </Box>
          <Box sx={{ height: 36, px: 1.5, display: "flex", alignItems: "center", backgroundColor: "#141a16", border: "1px solid #1f2521", borderRadius: "5px", color: "#8a9088", fontSize: 13, letterSpacing: "0.3px" }}>
            filter ▾
          </Box>
          <Box sx={{ height: 36, px: 1.5, display: "flex", alignItems: "center", backgroundColor: "#141a16", border: "1px solid #1f2521", borderRadius: "5px", color: "#8a9088", fontSize: 13, letterSpacing: "0.3px" }}>
            recent ▾
          </Box>
        </Box>
      </Box>

      <Box sx={{ backgroundColor: "#141a16", border: "1px solid #1f2521", borderRadius: "9px", overflow: "hidden" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns,
            gap: 2.5,
            px: 3,
            py: 1.75,
            borderBottom: "1px solid #1a201c",
            fontSize: 10.5,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#4a4f48",
            fontWeight: 500,
          }}
        >
          <Box />
          <Box>Document</Box>
          <Box sx={{ textAlign: "right" }}>Size</Box>
          <Box>Indexed</Box>
          <Box />
        </Box>

        {loading && (
          <Box sx={{ py: 6, textAlign: "center", fontSize: 14, color: "#4a4f48" }}>Loading library…</Box>
        )}

        {!loading && error && (
          <Box sx={{ py: 6, textAlign: "center", fontSize: 14, color: "#c87a5a" }}>{error}</Box>
        )}

        {!loading && !error && paged.length === 0 && (
          <Box sx={{ py: 6, textAlign: "center", fontSize: 14, color: "#4a4f48" }}>
            {documents.length === 0 ? "No documents indexed yet" : "No matches"}
          </Box>
        )}

        {!loading &&
          !error &&
          paged.map((doc, index) => (
            <Box
              key={doc.source}
              sx={{
                display: "grid",
                gridTemplateColumns,
                gap: 2.5,
                px: 3,
                py: 2.25,
                alignItems: "center",
                borderBottom: index === paged.length - 1 ? "none" : "1px solid #1a201c",
                "&:hover": { backgroundColor: "#161d18" },
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 40,
                  backgroundColor: "#2a302c",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8.5,
                  color: "#c8a96a",
                  fontWeight: 700,
                }}
              >
                {fileTypeLabel(doc.source)}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    fontSize: 14.5,
                    color: "#ece8df",
                    mb: 0.4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {doc.source}
                </Box>
                <Box sx={{ fontSize: 12, color: "#6f7670" }}>
                  {doc.chunks} chunk{doc.chunks === 1 ? "" : "s"}
                </Box>
              </Box>
              <Box sx={{ textAlign: "right", fontSize: 13, color: "#8a9088", fontVariantNumeric: "tabular-nums" }}>
                {formatFileSize(doc.sizeBytes)}
              </Box>
              <Box sx={{ fontSize: 13, color: "#8a9088" }}>{formatIndexedDate(doc.indexedAt)}</Box>
              <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                <Box component="span" title="indexed" sx={{ width: 7, height: 7, backgroundColor: "#6fbf73", borderRadius: "50%" }} />
              </Box>
            </Box>
          ))}
      </Box>

      {!loading && !error && filtered.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 0.5, py: 2.25, fontSize: 13, color: "#6f7670", letterSpacing: "0.4px" }}>
          <Box>
            showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </Box>
          <Box sx={{ display: "flex", gap: 0.75 }}>
            <Box
              component="button"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              sx={{
                width: 32,
                height: 32,
                backgroundColor: "transparent",
                border: "1px solid #1f2521",
                borderRadius: "5px",
                color: "#8a9088",
                cursor: "pointer",
                fontSize: 14,
                "&:disabled": { opacity: 0.4, cursor: "default" },
              }}
            >
              ‹
            </Box>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <Box
                key={p}
                component="button"
                type="button"
                onClick={() => setPage(p)}
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: p === currentPage ? "#c8a96a" : "transparent",
                  border: "1px solid",
                  borderColor: p === currentPage ? "#c8a96a" : "#1f2521",
                  borderRadius: "5px",
                  color: p === currentPage ? "#0e1411" : "#8a9088",
                  fontWeight: p === currentPage ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                }}
              >
                {p}
              </Box>
            ))}
            <Box
              component="button"
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
              sx={{
                width: 32,
                height: 32,
                backgroundColor: "transparent",
                border: "1px solid #1f2521",
                borderRadius: "5px",
                color: "#8a9088",
                cursor: "pointer",
                fontSize: 14,
                "&:disabled": { opacity: 0.4, cursor: "default" },
              }}
            >
              ›
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
