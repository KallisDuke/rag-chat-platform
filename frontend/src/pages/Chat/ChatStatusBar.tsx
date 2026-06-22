import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Box, IconButton, Stack, Typography, keyframes } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { isAdmin } from "../../utils";

const USER_NAME = "Kallis";

const pulseDot = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

const getGreeting = (hour: number) => {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

interface ChatStatusBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

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

export const ChatStatusBar: React.FC<ChatStatusBarProps> = ({
  sidebarOpen,
  onToggleSidebar,
}) => {
  const [now, setNow] = useState(new Date());
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("https://ipapi.co/json/")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((geo) => {
        if (!cancelled && geo.city) setCity(geo.city.toLowerCase());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = useMemo(() => getGreeting(now.getHours()), [now]);

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        gridColumn: 2,
        gridRow: 1,
        px: 4,
        gap: 3,
        borderBottom: "1px solid #1a201c",
        overflow: "hidden",
      }}
    >
      <IconButton
        onClick={onToggleSidebar}
        size="small"
        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        sx={{
          color: "#8a9088",
          border: "1px solid #1f2521",
          borderRadius: "5px",
          "&:hover": { color: "#ece8df", borderColor: "#2a302c" },
        }}
      >
        <MenuIcon sx={{ fontSize: 20 }} />
      </IconButton>

      <Stack direction="row" spacing={1.75} alignItems="center">
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
          {USER_NAME.charAt(0)}
        </Box>
        <Box sx={{ lineHeight: 1.2 }}>
          <Typography sx={{ fontSize: 14, color: "#ece8df" }}>
            {greeting}, {USER_NAME}
          </Typography>
          <Typography sx={{ fontSize: 12, letterSpacing: "0.5px", color: "#6f7670" }}>
            {city ?? "your"} · workspace
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ flex: 1 }} />

      {isAdmin() && (
        <Box
          component={Link}
          to="/admin"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            height: 40,
            px: 1.75,
            border: "1px solid #1f2521",
            borderRadius: "5px",
            color: "#8a9088",
            fontSize: 14,
            letterSpacing: "0.3px",
            textDecoration: "none",
            flex: "none",
            "&:hover": { borderColor: "#c8a96a", color: "#c8a96a" },
          }}
        >
          <ShieldOutlinedIcon sx={{ fontSize: 18 }} />
          Admin
        </Box>
      )}

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
          <span>vector_index · synced</span>
        </Box>
        <Box sx={pillSx}>
          <span>gpt-4.1-mini</span>
        </Box>
      </Stack>

      <Box
        component={Link}
        to="/upload"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          height: 40,
          px: 2,
          backgroundColor: "#ece8df",
          color: "#0e1411",
          borderRadius: "5px",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.3px",
          textDecoration: "none",
          flex: "none",
          "&:hover": { backgroundColor: "#f5f1e8" },
        }}
      >
        <UploadFileIcon sx={{ fontSize: 18 }} />
        Upload
      </Box>
    </Stack>
  );
};
