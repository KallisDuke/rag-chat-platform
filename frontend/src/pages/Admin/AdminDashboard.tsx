import React, { useCallback, useEffect, useState } from "react";
import { Alert, Box, CssBaseline, Snackbar, Typography } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdminTopBar } from "./AdminTopBar";
import { RequestsTable } from "./RequestsTable";
import { AccessRequest, AccessRequestsResponse } from "./types";
import { API_BASE_URL } from "../../config";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0e1411", paper: "#141a16" },
    primary: { main: "#c8a96a" },
    text: { primary: "#ece8df", secondary: "#8a9088" },
  },
  typography: {
    fontFamily: '"Roboto Mono", monospace',
  },
});

interface ApproveResponse {
  email: string;
  emailDelivered: boolean;
  emailError: string | null;
}

interface Notice {
  severity: "success" | "error" | "info";
  message: string;
}

export const AdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }),
    [],
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/access-requests`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to load requests: ${response.statusText}`);
      }
      const data: AccessRequestsResponse = await response.json();
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = useCallback(
    async (id: string) => {
      setActioningId(id);
      try {
        const response = await fetch(
          `${API_BASE_URL}/access-requests/${id}/approve`,
          { method: "POST", headers: authHeaders() },
        );
        const data = (await response.json().catch(() => null)) as
          | ApproveResponse
          | { message?: string }
          | null;

        if (!response.ok) {
          throw new Error(
            (data as { message?: string })?.message ?? "Approval failed",
          );
        }

        const approved = data as ApproveResponse;
        setNotice({
          severity: approved.emailDelivered ? "success" : "info",
          message: approved.emailDelivered
            ? `Approved — credentials emailed to ${approved.email}.`
            : `Approved ${approved.email}. Email not sent (SMTP not configured) — check the server logs for the password.`,
        });
        await loadRequests();
      } catch (err) {
        setNotice({
          severity: "error",
          message: err instanceof Error ? err.message : "Approval failed",
        });
      } finally {
        setActioningId(null);
      }
    },
    [authHeaders, loadRequests],
  );

  const handleReject = useCallback(
    async (id: string) => {
      setActioningId(id);
      try {
        const response = await fetch(
          `${API_BASE_URL}/access-requests/${id}/reject`,
          { method: "POST", headers: authHeaders() },
        );
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message ?? "Rejection failed");
        }
        setNotice({ severity: "info", message: "Request rejected." });
        await loadRequests();
      } catch (err) {
        setNotice({
          severity: "error",
          message: err instanceof Error ? err.message : "Rejection failed",
        });
      } finally {
        setActioningId(null);
      }
    },
    [authHeaders, loadRequests],
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: "72px 1fr",
          height: "100vh",
          width: "100%",
          backgroundColor: "#0e1411",
          color: "#ece8df",
        }}
      >
        <AdminTopBar pendingCount={pendingCount} />

        <Box sx={{ overflowY: "auto" }}>
          <Box sx={{ maxWidth: 1200, mx: "auto", px: 5, pt: 6, pb: 10 }}>
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontSize: 11,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#6f7670",
                  mb: 1,
                }}
              >
                ◐ Access control
              </Typography>
              <Typography
                sx={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.5px", color: "#f5f1e8" }}
              >
                Access requests
              </Typography>
              <Typography
                sx={{ fontSize: 13, color: "#8a9088", mt: 1, lineHeight: 1.5, maxWidth: 560 }}
              >
                Review who wants in. Approving a request provisions a workspace
                account and emails the new user their login URL, username, and a
                generated password.
              </Typography>
            </Box>

            <RequestsTable
              requests={requests}
              loading={loading}
              error={error}
              actioningId={actioningId}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={6000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {notice ? (
          <Alert
            severity={notice.severity}
            onClose={() => setNotice(null)}
            variant="filled"
            sx={{ fontFamily: '"Roboto Mono", monospace' }}
          >
            {notice.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ThemeProvider>
  );
};
