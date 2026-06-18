import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Typography,
  Button,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import { FileAttachment } from "./Chat/types";
import { Navbar } from "./Chat/Navbar";

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    setError(null);
    setSuccess(false);

    const files = Array.from(e.target.files || []);

    setSelectedFiles((prev) => [...prev, ...files]);

    setFiles((prev) => [
      ...prev,
      ...files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    ]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      setSuccess(true);
      setFiles([]);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#0d0d0d",
      }}
    >
      <Navbar />
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 3,
        }}
      >
      <Typography
        variant="h4"
        sx={{ color: "#ececec", marginBottom: 1, fontWeight: 600 }}
      >
        Upload Files
      </Typography>

      <Typography
        sx={{ color: "#888", marginBottom: 4, textAlign: "center", maxWidth: 500 }}
      >
        Once your files are uploaded, you can ask questions related to them in the chat.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ marginBottom: 3, maxWidth: 400 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ marginBottom: 3, maxWidth: 400 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate("/chat")}>
              Go to Chat
            </Button>
          }
        >
          Upload complete — you can chat now!
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        <IconButton
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title="Attach files"
          sx={{
            width: 100,
            height: 100,
            color: "#888",
            "&:hover": {
              color: "#aaa",
              backgroundColor: "rgba(255,255,255,0.05)",
            },
            "&:disabled": { color: "#555" },
          }}
        >
          <AttachFileIcon sx={{ fontSize: 60 }} />
        </IconButton>

        <Typography sx={{ color: "#888", textAlign: "center" }}>
          {files.length > 0
            ? `${files.length} file(s) selected`
            : "Click to select files"}
        </Typography>

        {files.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: 600,
            }}
          >
            {files.map((file, index) => (
              <Chip
                key={index}
                label={`${file.name} (${formatFileSize(file.size)})`}
                onDelete={() => removeFile(index)}
                deleteIcon={<CloseIcon />}
                size="small"
                disabled={loading}
                sx={{
                  backgroundColor: "#2a2a2a",
                  color: "#ececec",
                  borderColor: "#444",
                  "& .MuiChip-deleteIcon": {
                    color: "#aaa",
                    "&:hover": { color: "#fff" },
                  },
                }}
              />
            ))}
          </Box>
        )}

        {files.length > 0 && (
          <IconButton
            onClick={handleUpload}
            disabled={loading || files.length === 0}
            title="Upload files"
            sx={{
              color: "white",
              backgroundColor: "rgba(16, 163, 127, 0.2)",
              padding: 2,
              marginTop: 2,
              "&:hover": {
                backgroundColor: "rgba(16, 163, 127, 0.3)",
              },
              "&:disabled": { color: "#666" },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              <SendIcon sx={{ fontSize: 28 }} />
            )}
          </IconButton>
        )}
      </Box>
      </Box>
    </Box>
  );
};
