import React from "react";
import { Link } from "react-router-dom";
import { Box, Stack, Typography, keyframes } from "@mui/material";

const pulseDot = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

const pillSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  px: 1.5,
  py: 0.75,
  border: "1px solid #1f2521",
  borderRadius: "5px",
  fontSize: 13,
  letterSpacing: "0.4px",
  color: "#8a9088",
  whiteSpace: "nowrap",
} as const;

const crumbSx = {
  color: "#6f7670",
  textDecoration: "none",
  fontSize: 13,
  letterSpacing: "0.3px",
  px: 1.25,
  py: 0.6,
  borderRadius: "4px",
  "&:hover": { color: "#ece8df" },
} as const;

interface UploadTopBarProps {
  totalDocuments: number;
  totalChunks: number;
}

const formatVectorCount = (count: number) => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString();
};

export const UploadTopBar: React.FC<UploadTopBarProps> = ({
  totalDocuments,
  totalChunks,
}) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ height: 72, px: 4, gap: 3, borderBottom: "1px solid #1a201c" }}
    >
      <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: "none" }}>
        <Box sx={{ width: 28, height: 28, position: "relative" }}>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              border: "1.5px solid #ece8df",
              borderRadius: "50%",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: "6px",
              border: "1.5px solid #ece8df",
              borderRadius: "50%",
              opacity: 0.55,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 5,
              height: 5,
              backgroundColor: "#c8a96a",
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </Box>
        <Typography sx={{ fontSize: 17, fontWeight: 600, letterSpacing: "0.3px" }}>
          Kallis
          <Box component="span" sx={{ color: "#c8a96a" }}>
            .
          </Box>
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: 1 }}>
        <Box component={Link} to="/chat" sx={crumbSx}>
          chat
        </Box>
        <Box component="span" sx={{ color: "#4a4f48", fontSize: 13 }}>
          /
        </Box>
        <Box
          sx={{
            color: "#ece8df",
            fontSize: 13,
            letterSpacing: "0.3px",
            px: 1.25,
            py: 0.6,
            backgroundColor: "#1a201c",
            borderRadius: "4px",
          }}
        >
          uploads
        </Box>
      </Stack>

      <Box sx={{ flex: 1 }} />

      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box sx={pillSx}>
          <Box
            component="span"
            sx={{
              width: 6,
              height: 6,
              backgroundColor: "#6fbf73",
              borderRadius: "50%",
              animation: `${pulseDot} 2.4s ease-in-out infinite`,
            }}
          />
          <span>indexer · idle</span>
        </Box>
        <Box sx={pillSx}>
          <Box component="span" sx={{ color: "#c8a96a" }}>
            ⎈
          </Box>
          <span>
            {totalDocuments.toLocaleString()} docs · {formatVectorCount(totalChunks)} vectors
          </span>
        </Box>
      </Stack>

      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #c8a96a, #8a6e3e)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 600,
          color: "#0e1411",
          flex: "none",
        }}
      >
        K
      </Box>
    </Stack>
  );
};
