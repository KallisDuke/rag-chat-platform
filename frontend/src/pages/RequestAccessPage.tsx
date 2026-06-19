import { Link as RouterLink } from "react-router-dom";
import { keyframes } from "@emotion/react";
import { Box, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import RequestAccessForm from "../components/requestAccess/RequestAccessForm";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

const grainBackground =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

const stats = [
  { value: "12.4", unit: "M", label: "Vectors indexed" },
  { value: "98.2", unit: "%", label: "Citation accuracy" },
  { value: "240", unit: "ms", label: "Median p50" },
];

const avatarInitials = ["A", "M", "R"];

const perks = ["No credit card", "Free tier included"];

export default function RequestAccessPage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        width: "100%",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
        bgcolor: "#f7f5f0",
        fontFamily: "'Roboto Mono', monospace",
      }}
    >
      {/* LEFT: brand panel */}
      <Box
        sx={{
          position: "relative",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: "#0e1411",
          color: "#ece8df",
          px: { md: 5, lg: 7 },
          py: { md: 5, lg: 5.5 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.5,
            mixBlendMode: "overlay",
            backgroundImage: grainBackground,
          }}
        />

        {/* Logo / wordmark */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            position: "relative",
            zIndex: 2,
          }}
        >
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
                bgcolor: "#c8a96a",
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 22, letterSpacing: "0.3px" }}>
            Kallis<Box component="span" sx={{ color: "#c8a96a" }}>.</Box>
          </Typography>
          <Typography
            sx={{
              ml: 1,
              fontSize: 10,
              letterSpacing: "1.5px",
              color: "#6f7670",
              textTransform: "uppercase",
              px: 1,
              py: 0.5,
              border: "1px solid #2a302c",
              borderRadius: "3px",
            }}
          >
            RAG / v2.4
          </Typography>
        </Box>

        {/* Editorial headline */}
        <Box
          sx={{
            mt: "auto",
            mb: "auto",
            position: "relative",
            zIndex: 2,
            maxWidth: 540,
          }}
        >
          <Box
            sx={{
              fontSize: 11,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#8a9088",
              mb: 3.5,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
            }}
          >
            <Box
              component="span"
              sx={{
                width: 6,
                height: 6,
                bgcolor: "#c8a96a",
                borderRadius: "50%",
                animation: `${pulse} 2.4s ease-in-out infinite`,
              }}
            />
            Early access
          </Box>
          <Typography
            component="h1"
            sx={{
              fontFamily: "inherit",
              fontWeight: 400,
              fontSize: { md: 44, lg: 64 },
              lineHeight: 1.02,
              letterSpacing: "-1.5px",
              m: 0,
              color: "#f5f1e8",
            }}
          >
            Join the
            <br />
            <Box component="span" sx={{ fontStyle: "italic", color: "#c8a96a" }}>
              waitlist.
            </Box>
          </Typography>
          <Typography
            sx={{
              mt: 4,
              fontSize: 15,
              lineHeight: 1.65,
              color: "#b8bdb5",
              maxWidth: 440,
            }}
          >
            Kallis is currently available to select teams. Request access and we&apos;ll reach out
            when a spot opens up — usually within 48 hours.
          </Typography>

          {/* Social proof */}
          <Box sx={{ mt: 5, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ display: "flex" }}>
                {avatarInitials.map((initial, index) => (
                  <Box
                    key={initial}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: "#2a302c",
                      border: "2px solid #0e1411",
                      ml: index === 0 ? 0 : "-8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: "#c8a96a",
                      fontWeight: 600,
                    }}
                  >
                    {initial}
                  </Box>
                ))}
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: "#1f2521",
                    border: "2px solid #0e1411",
                    ml: "-8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: "#8a9088",
                  }}
                >
                  +
                </Box>
              </Box>
              <Box sx={{ fontSize: 12, color: "#8a9088", lineHeight: 1.4 }}>
                <Box component="span" sx={{ color: "#ece8df" }}>
                  340+ teams
                </Box>{" "}
                on the waitlist
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 4 }}>
              {perks.map((perk) => (
                <Box key={perk} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckIcon sx={{ fontSize: 14, color: "#6fbf73" }} />
                  <Box sx={{ fontSize: 11, color: "#b8bdb5" }}>{perk}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Footer stats */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            gap: 6,
            pt: 4,
            borderTop: "1px solid #1f2521",
          }}
        >
          {stats.map((stat) => (
            <Box key={stat.label}>
              <Box sx={{ fontSize: 28, color: "#f5f1e8", lineHeight: 1 }}>
                {stat.value}
                <Box component="span" sx={{ color: "#c8a96a" }}>
                  {stat.unit}
                </Box>
              </Box>
              <Box
                sx={{
                  fontSize: 10,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "#6f7670",
                  mt: 0.75,
                }}
              >
                {stat.label}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* RIGHT: form panel */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#f7f5f0",
          px: { xs: 3, sm: 5, md: 7 },
          py: { xs: 4, md: 5.5 },
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 3,
            fontSize: 13,
            color: "#5a5e57",
          }}
        >
          <Box component="span">Already have access?</Box>
          <Box
            component={RouterLink}
            to="/login"
            sx={{
              color: "#0e1411",
              textDecoration: "none",
              fontWeight: 500,
              px: 2,
              py: 1,
              border: "1px solid #d8d3c6",
              borderRadius: "6px",
              "&:hover": { bgcolor: "#efebe0" },
            }}
          >
            ← Sign in
          </Box>
        </Box>

        {/* Form */}
        <Box sx={{ m: "auto", width: "100%", maxWidth: 560, py: 5 }}>
          <RequestAccessForm />
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "#8a8d84",
            pt: 3,
            borderTop: "1px solid #e2ddd0",
          }}
        >
          <Box component="span">© 2026 Kallis Systems</Box>
          <Box sx={{ display: "flex", gap: 2.5 }}>
            <Box component="span">Privacy</Box>
            <Box component="span">Terms</Box>
            <Box component="span">Status ●</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
