import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Stack, Typography, keyframes } from "@mui/material";
import { logout } from "../../utils";

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

interface AdminTopBarProps {
  pendingCount: number;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ pendingCount }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        height: 72,
        px: { xs: 2, md: 4 },
        gap: { xs: 1.5, md: 3 },
        borderBottom: "1px solid #1a201c",
      }}
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
        <Typography
          sx={{
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: "0.3px",
            display: { xs: "none", sm: "block" },
          }}
        >
          Kallis
          <Box component="span" sx={{ color: "#c8a96a" }}>
            .
          </Box>
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: { xs: 0, md: 1 } }}>
        <Box component={Link} to="/chat" sx={crumbSx}>
          chat
        </Box>
        <Box component="span" sx={{ color: "#4a4f48", fontSize: 13 }}>
          /
        </Box>
        <Box component={Link} to="/upload" sx={crumbSx}>
          uploads
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
          admin
        </Box>
      </Stack>

      <Box sx={{ flex: 1 }} />

      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{ display: { xs: "none", sm: "flex" } }}
      >
        <Box sx={pillSx}>
          <Box
            component="span"
            sx={{
              width: 6,
              height: 6,
              backgroundColor: pendingCount > 0 ? "#c8a96a" : "#6fbf73",
              borderRadius: "50%",
              animation: `${pulseDot} 2.4s ease-in-out infinite`,
            }}
          />
          <span>
            {pendingCount} pending request{pendingCount === 1 ? "" : "s"}
          </span>
        </Box>
      </Stack>

      <Box
        component="button"
        type="button"
        onClick={handleLogout}
        sx={{
          height: 36,
          px: 1.75,
          backgroundColor: "transparent",
          border: "1px solid #1f2521",
          borderRadius: "5px",
          color: "#8a9088",
          fontFamily: "inherit",
          fontSize: 13,
          letterSpacing: "0.3px",
          cursor: "pointer",
          flex: "none",
          "&:hover": { borderColor: "#2a302c", color: "#ece8df" },
        }}
      >
        sign out
      </Box>
    </Stack>
  );
};
