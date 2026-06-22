import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { API_BASE_URL } from "../../config";

type FormErrors = {
  email?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email address is required";
    } else if (!emailPattern.test(email)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error("Invalid email or password");
        }

        const data: { token: string; role?: string; email?: string } =
          await response.json();
        localStorage.setItem("token", data.token);
        if (data.role) localStorage.setItem("role", data.role);
        if (data.email) localStorage.setItem("email", data.email);
        navigate("/chat");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Login failed";
        setError(errorMessage);
        setLoading(false);
      }
    }
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit}
      sx={{ width: "100%", fontFamily: "inherit" }}
    >
      <Typography
        sx={{
          fontFamily: "inherit",
          fontSize: 13,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "#8a8d84",
          mb: 3,
        }}
      >
        ◐ Sign in
      </Typography>

      <Typography
        component="h2"
        sx={{
          fontFamily: "inherit",
          fontWeight: 400,
          fontSize: 56,
          lineHeight: 1.05,
          letterSpacing: "-1px",
          color: "#0e1411",
          m: 0,
          mb: 2,
        }}
      >
        Welcome back.
      </Typography>
      <Typography
        sx={{
          fontFamily: "inherit",
          fontSize: 17,
          color: "#6a6e66",
          lineHeight: 1.5,
          mb: 6,
        }}
      >
        Enter your credentials to access your workspace and continue your
        conversations.
      </Typography>

      <Stack spacing={2.75}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box>
          <Typography
            component="label"
            htmlFor="email"
            sx={{
              display: "block",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 500,
              color: "#3a3e37",
              mb: 1,
              letterSpacing: "0.1px",
            }}
          >
            Email
          </Typography>
          <TextField
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email}
            id="email"
            name="email"
            placeholder="you@company.com"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email)
                setErrors((current) => ({ ...current, email: undefined }));
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ fontSize: 20, color: "#8a8d84" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={fieldStyles}
          />
        </Box>

        <Box>
          <Typography
            component="label"
            htmlFor="password"
            sx={{
              display: "block",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 500,
              color: "#3a3e37",
              mb: 1,
              letterSpacing: "0.1px",
            }}
          >
            Password
          </Typography>
          <TextField
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password}
            id="password"
            name="password"
            placeholder="••••••••••••"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) {
                setErrors((current) => ({ ...current, password: undefined }));
              }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 20, color: "#8a8d84" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={fieldStyles}
          />
        </Box>

        <Button
          fullWidth
          type="submit"
          variant="contained"
          disabled={loading}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{
            mt: 1,
            height: 64,
            borderRadius: "8px",
            bgcolor: "#0e1411",
            color: "#f5f1e8",
            fontFamily: "inherit",
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: "0.2px",
            textTransform: "none",
            boxShadow: "none",
            "&:hover": { bgcolor: "#1a221d", boxShadow: "none" },
          }}
        >
          {loading ? "Signing in..." : "Sign in to workspace"}
        </Button>
      </Stack>
    </Box>
  );
}

const fieldStyles = {
  fontFamily: "inherit",
  "& .MuiOutlinedInput-root": {
    height: 60,
    borderRadius: "8px",
    bgcolor: "#ffffff",
    fontFamily: "inherit",
    fontSize: 16,
    color: "#0e1411",
    "& fieldset": {
      borderColor: "#d8d3c6",
    },
    "&:hover fieldset": {
      borderColor: "#d8d3c6",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#0e1411",
      borderWidth: "1px",
      boxShadow: "0 0 0 3px rgba(14, 20, 17, 0.08)",
    },
  },
  "& .MuiInputAdornment-root": {
    mr: 1,
  },
  "& input::placeholder": {
    color: "#8a8d84",
    opacity: 1,
  },
} as const;
