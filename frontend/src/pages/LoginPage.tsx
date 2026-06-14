import { Box, Paper } from "@mui/material";
import LoginForm from "../components/login/LoginForm";
import loginIllustration from "../assets/login-illustration.svg";

export default function LoginPage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "49% 51%" },
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Box
        aria-label="Login illustration"
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          p: 6,
        }}
      >
        <Box
          component="img"
          src={loginIllustration}
          alt="Person signing in at a desk"
          sx={{ width: "min(76%, 650px)", height: "auto" }}
        />
      </Box>

      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "primary.main",
          borderTopLeftRadius: { xs: 0, md: 42 },
          borderBottomLeftRadius: { xs: 0, md: 42 },
          px: { xs: 2, sm: 4, lg: 8 },
          py: { xs: 4, md: 6 },
          overflow: "hidden",
          isolation: "isolate",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            zIndex: -1,
            width: { xs: 390, md: 580 },
            height: { xs: 390, md: 580 },
            border: "2px solid rgba(255,255,255,0.72)",
            borderRadius: "50%",
            right: { xs: -255, md: -290 },
            bottom: { xs: -270, md: -410 },
          },
          "&::after": {
            width: { xs: 300, md: 470 },
            height: { xs: 300, md: 470 },
            right: { xs: -210, md: -225 },
            bottom: { xs: -230, md: -370 },
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "min(100%, 505px)",
            borderRadius: 3,
            px: { xs: 3, sm: 5.5 },
            py: { xs: 4, sm: 5 },
          }}
        >
          <LoginForm />
        </Paper>
      </Box>
    </Box>
  );
}
