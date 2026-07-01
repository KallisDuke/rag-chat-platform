import React, { useRef, useState } from "react";
import { Box, Chip, IconButton, TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { FileAttachment } from "./types";

interface ChatInputProps {
  onSendMessage: (message: string, files?: FileAttachment[]) => void;
  disabled?: boolean;
  topK: number;
  onTopKChange: (value: number) => void;
  // Controlled input text, lifted to the parent so suggestion clicks can
  // pre-fill it. `inputRef` lets the parent focus the field after filling.
  input: string;
  onInputChange: (value: string) => void;
  inputRef?: React.Ref<HTMLTextAreaElement>;
}

// How many chunks to retrieve per query; clicking the chip cycles through these.
const TOP_K_OPTIONS = [3, 5, 8];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  topK,
  onTopKChange,
  input,
  onInputChange,
  inputRef,
}) => {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (input.trim() || files.length > 0) {
      onSendMessage(input, files.length > 0 ? files : undefined);
      onInputChange("");
      setFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const reader = new FileReader();
      reader.onload = (event) => {
        fileAttachment.data = event.target?.result as string;
      };
      reader.readAsDataURL(file);

      newFiles.push(fileAttachment);
    }

    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const cycleTopK = () => {
    const currentIndex = TOP_K_OPTIONS.indexOf(topK);
    const next = TOP_K_OPTIONS[(currentIndex + 1) % TOP_K_OPTIONS.length];
    onTopKChange(next);
  };

  return (
    <Box sx={{ px: { xs: 2, md: 5 }, pt: 2, pb: { xs: 2.5, md: 3.5 }, borderTop: "1px solid #1a201c" }}>
      <Box sx={{ maxWidth: 860, mx: "auto" }}>
        <Box
          sx={{
            backgroundColor: "#141a16",
            border: "1px solid #1f2521",
            borderRadius: "12px",
            p: "16px 18px",
            transition: "border-color 0.15s",
            "&:hover": { borderColor: "#2a302c" },
          }}
        >
          {files.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              {files.map((file, index) => (
                <Chip
                  key={index}
                  label={file.name}
                  onDelete={() => removeFile(index)}
                  size="small"
                  sx={{
                    backgroundColor: "#1a201c",
                    color: "#ece8df",
                    fontSize: 13,
                  }}
                />
              ))}
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            maxRows={6}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            inputRef={inputRef}
            placeholder="ask anything, or attach a doc"
            variant="standard"
            slotProps={{ input: { disableUnderline: true } }}
            sx={{
              "& .MuiInputBase-root": {
                fontFamily: "inherit",
                fontSize: 15,
                lineHeight: 1.55,
                color: "#ece8df",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "#4a4f48",
                opacity: 1,
              },
            }}
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 1.5,
              flexWrap: "wrap",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <Box
              component="button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                height: 34,
                px: 1.5,
                backgroundColor: "transparent",
                border: "1px solid #1f2521",
                borderRadius: "5px",
                color: "#8a9088",
                fontFamily: "inherit",
                fontSize: 13,
                letterSpacing: "0.3px",
                cursor: "pointer",
                "&:hover": { borderColor: "#2a302c", color: "#ece8df" },
                "&:disabled": { opacity: 0.5, cursor: "default" },
              }}
            >
              <AttachFileIcon sx={{ fontSize: 16 }} />
              attach{files.length > 0 ? ` · ${files.length}` : ""}
            </Box>

            <Box
              component="button"
              type="button"
              onClick={cycleTopK}
              disabled={disabled}
              title="chunks retrieved per query — click to change"
              sx={{
                display: "flex",
                alignItems: "center",
                height: 34,
                px: 1.5,
                backgroundColor: "transparent",
                border: "1px solid #1f2521",
                borderRadius: "5px",
                color: "#8a9088",
                fontFamily: "inherit",
                fontSize: 13,
                letterSpacing: "0.3px",
                cursor: "pointer",
                "&:hover": { borderColor: "#2a302c", color: "#ece8df" },
                "&:disabled": { opacity: 0.5, cursor: "default" },
              }}
            >
              top-k {topK}
            </Box>

            <Box sx={{ flex: 1 }} />

            <Box
              sx={{
                fontSize: 12,
                color: "#4a4f48",
                letterSpacing: "0.5px",
                display: { xs: "none", sm: "block" },
              }}
            >
              enter ↵ to send · shift+enter for newline
            </Box>

            <IconButton
              onClick={handleSend}
              disabled={disabled || (!input.trim() && files.length === 0)}
              sx={{
                height: 38,
                px: 2.25,
                borderRadius: "6px",
                backgroundColor: "#c8a96a",
                color: "#0e1411",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.3px",
                "&:hover": { backgroundColor: "#d4b878" },
                "&.Mui-disabled": {
                  backgroundColor: "#2a302c",
                  color: "#6f7670",
                },
              }}
            >
              send
              <SendIcon sx={{ fontSize: 16, ml: 1 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
