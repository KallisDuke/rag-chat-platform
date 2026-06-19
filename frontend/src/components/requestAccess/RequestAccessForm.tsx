import { useState, type FormEvent } from "react";
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

type FormErrors = {
  fullName?: string;
  email?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RequestAccessForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [useCase, setUseCase] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = "Full name is required";
    }

    if (!email.trim()) {
      nextErrors.email = "Work email is required";
    } else if (!emailPattern.test(email)) {
      nextErrors.email = "Enter a valid email address";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <Box sx={{ width: "100%", fontFamily: "inherit" }}>
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
          ◐ Request received
        </Typography>
        <Typography
          component="h2"
          sx={{
            fontFamily: "inherit",
            fontWeight: 400,
            fontSize: 48,
            lineHeight: 1.08,
            letterSpacing: "-1px",
            color: "#0e1411",
            m: 0,
            mb: 2,
          }}
        >
          You&apos;re on the list
          <Box component="span" sx={{ color: "#c8a96a" }}>
            .
          </Box>
        </Typography>
        <Typography sx={{ fontFamily: "inherit", fontSize: 16, color: "#6a6e66", lineHeight: 1.6 }}>
          Thanks, {fullName.trim()}. We&apos;ll reach out to {email.trim()} within 48 hours when your
          workspace is ready.
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: "100%", fontFamily: "inherit" }}>
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
        ◐ Request access
      </Typography>

      <Typography
        component="h2"
        sx={{
          fontFamily: "inherit",
          fontWeight: 400,
          fontSize: 48,
          lineHeight: 1.08,
          letterSpacing: "-1px",
          color: "#0e1411",
          m: 0,
          mb: 2,
        }}
      >
        Get early access
        <Box component="span" sx={{ color: "#c8a96a" }}>
          .
        </Box>
      </Typography>
      <Typography sx={{ fontFamily: "inherit", fontSize: 16, color: "#6a6e66", lineHeight: 1.6, mb: 5 }}>
        Submit your work email and we&apos;ll notify you when your workspace is ready.
      </Typography>

      <Stack spacing={3}>
        <Box>
          <Typography
            component="label"
            htmlFor="fullName"
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
            Full name
          </Typography>
          <TextField
            fullWidth
            error={Boolean(errors.fullName)}
            helperText={errors.fullName}
            id="fullName"
            name="fullName"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value);
              if (errors.fullName) {
                setErrors((current) => ({ ...current, fullName: undefined }));
              }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ fontSize: 22, color: "#8a8d84" }} />
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
            htmlFor="workEmail"
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
            Work email
          </Typography>
          <TextField
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email}
            id="workEmail"
            name="workEmail"
            placeholder="you@company.com"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) {
                setErrors((current) => ({ ...current, email: undefined }));
              }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ fontSize: 22, color: "#8a8d84" }} />
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
            htmlFor="useCase"
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
            What will you use Kallis for?{" "}
            <Box component="span" sx={{ color: "#8a8d84", fontWeight: 400 }}>
              (optional)
            </Box>
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            id="useCase"
            name="useCase"
            placeholder="e.g. Internal knowledge base for our engineering team..."
            value={useCase}
            onChange={(event) => setUseCase(event.target.value)}
            sx={fieldStyles}
          />
        </Box>

        <Button
          fullWidth
          type="submit"
          variant="contained"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{
            mt: 0.5,
            height: 60,
            borderRadius: "8px",
            bgcolor: "#0e1411",
            color: "#f5f1e8",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "0.2px",
            textTransform: "none",
            boxShadow: "none",
            "&:hover": { bgcolor: "#1a221d", boxShadow: "none" },
          }}
        >
          Request access
        </Button>

        <Typography sx={{ fontFamily: "inherit", fontSize: 12, color: "#8a8d84", lineHeight: 1.55, textAlign: "center" }}>
          By requesting access you agree to our{" "}
          <Box component="span" sx={{ color: "#5a5e57", textDecoration: "underline", cursor: "pointer" }}>
            terms
          </Box>{" "}
          and{" "}
          <Box component="span" sx={{ color: "#5a5e57", textDecoration: "underline", cursor: "pointer" }}>
            privacy policy
          </Box>
          .
        </Typography>
      </Stack>
    </Box>
  );
}

const fieldStyles = {
  fontFamily: "inherit",
  "& .MuiOutlinedInput-root": {
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
  "& .MuiOutlinedInput-input": {
    height: 56,
    boxSizing: "border-box",
    py: 0,
    display: "flex",
    alignItems: "center",
  },
  "& .MuiInputBase-multiline": {
    height: "auto",
    py: 1.75,
  },
  "& .MuiInputBase-multiline .MuiOutlinedInput-input": {
    height: "auto",
  },
  "& .MuiInputAdornment-root": {
    mr: 1,
  },
  "& input::placeholder, & textarea::placeholder": {
    color: "#8a8d84",
    opacity: 1,
  },
} as const;
