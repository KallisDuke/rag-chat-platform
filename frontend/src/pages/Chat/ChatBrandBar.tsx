import React from "react";
import { Box, Typography } from "@mui/material";

export const ChatBrandBar: React.FC = () => {
  return (
    <Box
      sx={{
        gridColumn: 1,
        gridRow: 1,
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        borderBottom: "1px solid #1a201c",
        borderRight: "1px solid #1a201c",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      <Box sx={{ width: 28, height: 28, position: "relative", flex: "none" }}>
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
      <Typography
        sx={{ fontSize: 17, fontWeight: 600, letterSpacing: "0.3px" }}
      >
        Kallis
        <Box component="span" sx={{ color: "#c8a96a" }}>
          .
        </Box>
      </Typography>
      <Box
        sx={{
          ml: "auto",
          fontSize: 12,
          letterSpacing: "1.5px",
          color: "#6f7670",
          textTransform: "uppercase",
          px: 1.1,
          py: 0.5,
          border: "1px solid #1f2521",
          borderRadius: "4px",
        }}
      >
        RAG
      </Box>
    </Box>
  );
};
