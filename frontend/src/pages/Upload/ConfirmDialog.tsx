import React from "react";
import { Box, CircularProgress, Dialog, Typography } from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const buttonBase = {
  height: 38,
  px: 2.25,
  borderRadius: "5px",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.3px",
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 1,
  border: "1px solid",
  "&:disabled": { opacity: 0.5, cursor: "default" },
} as const;

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!loading) onCancel();
      }}
      slotProps={{
        backdrop: { sx: { backgroundColor: "rgba(6, 10, 8, 0.72)" } },
        paper: {
          sx: {
            backgroundColor: "#141a16",
            border: "1px solid #1f2521",
            borderRadius: "10px",
            backgroundImage: "none",
            width: 420,
            maxWidth: "calc(100% - 48px)",
          },
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#ece8df", mb: 1.25 }}>
          {title}
        </Typography>
        <Box sx={{ fontSize: 13.5, color: "#8a9088", lineHeight: 1.55 }}>
          {description}
        </Box>

        {error && (
          <Box
            sx={{
              mt: 2,
              px: 1.75,
              py: 1.25,
              backgroundColor: "#1c1512",
              border: "1px solid #3a2620",
              borderRadius: "6px",
              fontSize: 12.5,
              color: "#c87a5a",
              lineHeight: 1.5,
            }}
          >
            {error}
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.25, mt: 3 }}>
          <Box
            component="button"
            type="button"
            onClick={onCancel}
            disabled={loading}
            sx={{
              ...buttonBase,
              backgroundColor: "transparent",
              borderColor: "#1f2521",
              color: "#8a9088",
              "&:hover": { borderColor: "#2a302c", color: "#ece8df" },
            }}
          >
            {cancelLabel}
          </Box>
          <Box
            component="button"
            type="button"
            onClick={onConfirm}
            disabled={loading}
            sx={{
              ...buttonBase,
              backgroundColor: "#c87a5a",
              borderColor: "#c87a5a",
              color: "#0e1411",
              "&:hover": { backgroundColor: "#d0866a", borderColor: "#d0866a" },
            }}
          >
            {loading && <CircularProgress size={13} sx={{ color: "#0e1411" }} />}
            {confirmLabel}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};
