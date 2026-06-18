import React, { useState, useRef } from "react";
import { Box, TextField, IconButton, Chip } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { FileAttachment } from "./types";

interface ChatInputProps {
  onSendMessage: (message: string, files?: FileAttachment[]) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (input.trim() || files.length > 0) {
      onSendMessage(input, files.length > 0 ? files : undefined);
      setInput("");
      setFiles([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FileAttachment[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileAttachment: FileAttachment = {
        name: file.name,
        size: file.size,
        type: file.type,
      };

      // Read file as base64 for preview (optional)
      const reader = new FileReader();
      reader.onload = (event) => {
        fileAttachment.data = event.target?.result as string;
      };
      reader.readAsDataURL(file);

      newFiles.push(fileAttachment);
    }

    setFiles([...files, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#0d0d0d" }}>
      {files.length > 0 && (
        <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {files.map((file, index) => (
            <Chip
              key={index}
              label={`${file.name} (${formatFileSize(file.size)})`}
              onDelete={() => removeFile(index)}
              size="small"
              sx={{
                backgroundColor: "#2a2a2a",
                color: "#ececec",
                borderColor: "#444",
              }}
            />
          ))}
        </Box>
      )}
      <Box
        sx={{ display: "flex", gap: 1, maxWidth: "800px", margin: "0 auto" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <IconButton
          size="small"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach files"
          sx={{
            color: "#888",
            "&:hover": { color: "#aaa" },
          }}
        >
          <AttachFileIcon />
        </IconButton>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#2a2a2a",
              color: "#ececec",
              borderRadius: "12px",
              "& fieldset": {
                borderColor: "#444",
              },
              "&:hover fieldset": {
                borderColor: "#555",
              },
              "&.Mui-focused fieldset": {
                borderColor: "white",
              },
            },
            "& .MuiOutlinedInput-input::placeholder": {
              color: "#888",
              opacity: 1,
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={disabled || (!input.trim() && files.length === 0)}
          sx={{
            color: "white",
            "&:hover": { backgroundColor: "rgba(16, 163, 127, 0.1)" },
            "&:disabled": { color: "#666" },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
