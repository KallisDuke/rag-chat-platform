import React, { useRef, useState } from "react";
import { Box, Chip, CircularProgress, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { API_BASE_URL } from "../../config";

const ACCEPTED_LABELS = [".pdf", ".docx", ".txt", ".md", ".html", ".csv"];
const API_BASE = API_BASE_URL;

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

interface DropzoneProps {
  onUploaded: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    setError(null);
    setSuccess(null);
    setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      setSuccess(`Indexed ${selectedFiles.length} file(s)`);
      setSelectedFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ mb: 6 }}>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => e.target.files && addFiles(e.target.files)}
        style={{ display: "none" }}
      />

      <Box
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
        }}
        sx={{
          position: "relative",
          backgroundColor: isDragging ? "#161d18" : "#141a16",
          border: "1.5px dashed",
          borderColor: isDragging ? "#c8a96a" : "#2a302c",
          borderRadius: "12px",
          p: { xs: 3, md: 7 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: { xs: 280, md: 400 },
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": { borderColor: "#c8a96a", backgroundColor: "#161d18" },
        }}
      >
        <Box sx={{ position: "relative", width: 108, height: 108, mb: 4 }}>
          <Box
            sx={{
              position: "absolute",
              left: 22,
              top: 10,
              width: 64,
              height: 78,
              backgroundColor: "#1f2521",
              border: "1px solid #2a302c",
              borderRadius: "6px",
              transform: "rotate(-8deg)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: 15,
              top: 17,
              width: 68,
              height: 86,
              backgroundColor: "#2a302c",
              border: "1px solid #3a3f37",
              borderRadius: "6px",
              transform: "rotate(4deg)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: 22,
              top: 15,
              width: 68,
              height: 88,
              backgroundColor: "#ece8df",
              borderRadius: "6px",
              display: "flex",
              flexDirection: "column",
              p: 1.75,
              gap: 0.75,
            }}
          >
            <Box sx={{ height: 2.5, backgroundColor: "#0e1411", borderRadius: "1px", width: "60%" }} />
            <Box sx={{ height: 2.5, backgroundColor: "#2a302c", borderRadius: "1px", width: "100%" }} />
            <Box sx={{ height: 2.5, backgroundColor: "#2a302c", borderRadius: "1px", width: "80%" }} />
            <Box sx={{ height: 2.5, backgroundColor: "#2a302c", borderRadius: "1px", width: "100%" }} />
            <Box sx={{ height: 2.5, backgroundColor: "#2a302c", borderRadius: "1px", width: "70%" }} />
            <Box sx={{ height: 2.5, backgroundColor: "#2a302c", borderRadius: "1px", width: "90%" }} />
          </Box>
          <Box
            sx={{
              position: "absolute",
              right: -3,
              bottom: -5,
              width: 34,
              height: 34,
              backgroundColor: "#c8a96a",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0e1411",
              border: "3px solid #141a16",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Box>
        </Box>

        <Box sx={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <Typography sx={{ fontSize: 21, fontWeight: 500, color: "#ece8df", mb: 1 }}>
            Drop files here, or{" "}
            <Box component="span" sx={{ color: "#c8a96a" }}>
              click to browse
            </Box>
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#6f7670", letterSpacing: "0.5px" }}>
            PDF · DOCX · TXT · MD · HTML · CSV — up to 10 MB per file, 10 files per batch
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mt: 3.5, flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 1 }}>
          {ACCEPTED_LABELS.map((label) => (
            <Box
              key={label}
              sx={{
                fontSize: 11.5,
                px: 1.25,
                py: 0.6,
                backgroundColor: "#1a201c",
                border: "1px solid #1f2521",
                borderRadius: "4px",
                color: "#b8bdb5",
                letterSpacing: "0.5px",
              }}
            >
              {label}
            </Box>
          ))}
        </Box>
      </Box>

      {error && (
        <Box sx={{ mt: 2.5, p: 2, border: "1px solid #c87a5a", borderRadius: "7px", color: "#c87a5a", fontSize: 14 }}>
          {error}
        </Box>
      )}
      {success && (
        <Box sx={{ mt: 2.5, p: 2, border: "1px solid #6fbf73", borderRadius: "7px", color: "#6fbf73", fontSize: 14 }}>
          {success}
        </Box>
      )}

      {selectedFiles.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 3, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap", flex: 1 }}>
            {selectedFiles.map((file, index) => (
              <Chip
                key={`${file.name}-${index}`}
                label={`${file.name} · ${formatFileSize(file.size)}`}
                onDelete={() => removeFile(index)}
                deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                disabled={uploading}
                sx={{
                  height: 32,
                  backgroundColor: "#141a16",
                  border: "1px solid #1f2521",
                  color: "#ece8df",
                  fontSize: 13,
                  "& .MuiChip-deleteIcon": { color: "#6f7670", "&:hover": { color: "#ece8df" } },
                }}
              />
            ))}
          </Box>
          <Box
            component="button"
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              height: 44,
              px: 3,
              backgroundColor: "#c8a96a",
              border: "none",
              borderRadius: "7px",
              color: "#0e1411",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.3px",
              cursor: "pointer",
              flex: "none",
              "&:hover": { backgroundColor: "#d4b878" },
              "&:disabled": { backgroundColor: "#2a302c", color: "#6f7670", cursor: "default" },
            }}
          >
            {uploading && <CircularProgress size={18} sx={{ color: "inherit" }} />}
            {uploading ? "indexing…" : `index ${selectedFiles.length} file(s)`}
          </Box>
        </Box>
      )}
    </Box>
  );
};
