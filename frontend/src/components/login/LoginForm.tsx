import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

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
  const [submitted, setSubmitted] = useState(false);
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
    setSubmitted(Object.keys(nextErrors).length === 0);

    if (Object.keys(nextErrors).length === 0) {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("http://localhost:3000/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error("Invalid email or password");
        }

        const data: { token: string } = await response.json();
        localStorage.setItem("token", data.token);
        setSubmitted(true);
        setLoading(false);
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
      sx={{ width: "100%" }}
    >
      <Stack spacing={{ xs: 2.25, sm: 2.75 }}>
        <Box>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 34, sm: 40 },
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            Hello Kallis!
          </Typography>
          <Typography
            color="text.primary"
            sx={{ mt: 3.5, fontSize: { xs: 20, sm: 25 }, fontWeight: 400 }}
          >
            Get Started
          </Typography>
        </Box>

        {submitted && !error && (
          <Alert severity="success" onClose={() => setSubmitted(false)}>
            Your login details are valid.
          </Alert>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          error={Boolean(errors.email)}
          helperText={errors.email}
          id="email"
          name="email"
          placeholder="Email Address"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSubmitted(false);
            if (errors.email)
              setErrors((current) => ({ ...current, email: undefined }));
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={fieldStyles}
        />

        <TextField
          fullWidth
          error={Boolean(errors.password)}
          helperText={errors.password}
          id="password"
          name="password"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setSubmitted(false);
            if (errors.password) {
              setErrors((current) => ({ ...current, password: undefined }));
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={fieldStyles}
        />

        <Button
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            minHeight: 70,
            borderRadius: 999,
            boxShadow: "none",
            fontSize: 18,
            "&:hover": { boxShadow: "none" },
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>

        <Link
          component="button"
          type="button"
          underline="hover"
          color="text.secondary"
          sx={{ alignSelf: "flex-start", fontSize: 17 }}
          onClick={() => setSubmitted(false)}
        >
          Forgot Password
        </Link>
      </Stack>
    </Box>
  );
}

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    minHeight: 70,
    borderRadius: 999,
    px: 1.5,
    fontSize: 18,
    color: "text.primary",
    "& fieldset": {
      borderColor: "#c6c6c6",
    },
    "&:hover fieldset": {
      borderColor: "#9e9e9e",
    },
  },
  "& .MuiInputAdornment-root": {
    color: "#a9a9a9",
    mr: 1,
  },
  "& input::placeholder": {
    color: "#a9a9a9",
    opacity: 1,
  },
} as const;
