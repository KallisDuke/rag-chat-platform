import React from "react";
import { Box, Paper, Typography, Chip, Link, keyframes } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { Message } from "./types";

const dancingDots = keyframes`
  0%, 20%, 50%, 80%, 100% {
    opacity: 1;
  }
  40% {
    opacity: 0.5;
  }
  60% {
    opacity: 0.7;
  }
`;

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDownload = (file: any) => {
    if (file.data) {
      const link = document.createElement("a");
      link.href = file.data;
      link.download = file.name;
      link.click();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 3,
        width: "100%",
        maxWidth: "80%",
        mx: "auto",
      }}
    >
      <Paper
        sx={{
          maxWidth: "65%",
          p: 1.5,
          backgroundColor: isUser ? "#2a2a2a" : "black",
          color: isUser ? "white" : "#ececec",
          borderRadius: "30px",
          boxShadow: "none",
        }}
      >
        {message.content && (
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.95rem",
              lineHeight: 1.4,
              color: isUser ? "white" : "#ececec",
              textAlign: isUser ? "center" : "left",
              whiteSpace: "pre-wrap",
              ...(message.content === "..." && {
                "& span": {
                  display: "inline-block",
                  width: "0.4em",
                  animation: `${dancingDots} 1.4s infinite`,
                  "&:nth-of-type(2)": {
                    animationDelay: "0.2s",
                  },
                  "&:nth-of-type(3)": {
                    animationDelay: "0.4s",
                  },
                },
              }),
            }}
          >
            {message.content === "..." ? (
              <>
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </>
            ) : (
              message.content
            )}
          </Typography>
        )}
        {message.files && message.files.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {message.files.map((file, index) => (
              <Chip
                key={index}
                icon={<DownloadIcon />}
                label={`${file.name} (${formatFileSize(file.size)})`}
                onClick={() => handleDownload(file)}
                variant="outlined"
                size="small"
                sx={{
                  mr: 1,
                  mb: 1,
                  backgroundColor: isUser ? "rgba(255,255,255,0.2)" : "#444",
                  color: isUser ? "white" : "#ececec",
                  borderColor: isUser ? "rgba(255,255,255,0.3)" : "#555",
                  cursor: "pointer",
                }}
              />
            ))}
          </Box>
        )}
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: "block",
            opacity: 0.6,
            fontSize: "0.75rem",
            color: isUser ? "rgba(255,255,255,0.8)" : "#888",
            textAlign: isUser ? "right" : "left",
          }}
        >
          {message.timestamp.toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};
