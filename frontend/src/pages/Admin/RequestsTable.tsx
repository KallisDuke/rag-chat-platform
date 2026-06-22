import React, { useMemo, useState } from "react";
import { Box, InputBase, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { AccessRequest, AccessRequestStatus } from "./types";

const gridTemplateColumns = "1.6fr 1.5fr 0.8fr 0.8fr 170px";

const statusStyles: Record<
  AccessRequestStatus,
  { label: string; color: string; dot: string }
> = {
  pending: { label: "Pending", color: "#c8a96a", dot: "#c8a96a" },
  approved: { label: "Approved", color: "#6fbf73", dot: "#6fbf73" },
  rejected: { label: "Rejected", color: "#c87a5a", dot: "#c87a5a" },
};

const formatRequestedDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

interface RequestsTableProps {
  requests: AccessRequest[];
  loading: boolean;
  error: string | null;
  actioningId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const RequestsTable: React.FC<RequestsTableProps> = ({
  requests,
  loading,
  error,
  actioningId,
  onApprove,
  onReject,
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter(
      (r) =>
        r.fullName.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term),
    );
  }, [requests, search]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.75 }}>
          <Typography
            sx={{ fontSize: 17, fontWeight: 600, letterSpacing: "0.3px", color: "#ece8df" }}
          >
            Requests
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#6f7670", letterSpacing: "0.4px" }}>
            {requests.length.toLocaleString()} total
          </Typography>
        </Box>

        <Box sx={{ position: "relative", display: "flex", alignItems: "center" }}>
          <SearchIcon sx={{ position: "absolute", left: 10, fontSize: 16, color: "#6f7670" }} />
          <InputBase
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search name or email"
            sx={{
              height: 36,
              pl: 4.25,
              pr: 1.5,
              width: 260,
              backgroundColor: "#141a16",
              border: "1px solid #1f2521",
              borderRadius: "5px",
              fontSize: 13,
              color: "#ece8df",
              "&.Mui-focused": { borderColor: "#2a302c" },
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          backgroundColor: "#141a16",
          border: "1px solid #1f2521",
          borderRadius: "9px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns,
            gap: 2.5,
            px: 3,
            py: 1.75,
            borderBottom: "1px solid #1a201c",
            fontSize: 10.5,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#4a4f48",
            fontWeight: 500,
          }}
        >
          <Box>Requester</Box>
          <Box>Use case</Box>
          <Box>Requested</Box>
          <Box>Status</Box>
          <Box sx={{ textAlign: "right" }}>Actions</Box>
        </Box>

        {loading && (
          <Box sx={{ py: 6, textAlign: "center", fontSize: 14, color: "#4a4f48" }}>
            Loading requests…
          </Box>
        )}

        {!loading && error && (
          <Box sx={{ py: 6, textAlign: "center", fontSize: 14, color: "#c87a5a" }}>
            {error}
          </Box>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Box sx={{ py: 6, textAlign: "center", fontSize: 14, color: "#4a4f48" }}>
            {requests.length === 0 ? "No access requests yet" : "No matches"}
          </Box>
        )}

        {!loading &&
          !error &&
          filtered.map((request, index) => {
            const status = statusStyles[request.status];
            const isPending = request.status === "pending";
            const busy = actioningId === request._id;

            return (
              <Box
                key={request._id}
                sx={{
                  display: "grid",
                  gridTemplateColumns,
                  gap: 2.5,
                  px: 3,
                  py: 2.25,
                  alignItems: "center",
                  borderBottom:
                    index === filtered.length - 1 ? "none" : "1px solid #1a201c",
                  "&:hover": { backgroundColor: "#161d18" },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      fontSize: 14.5,
                      color: "#ece8df",
                      mb: 0.4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {request.fullName}
                  </Box>
                  <Box
                    sx={{
                      fontSize: 12,
                      color: "#6f7670",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {request.email}
                  </Box>
                </Box>

                <Box
                  sx={{
                    fontSize: 13,
                    color: "#8a9088",
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {request.useCase || "—"}
                </Box>

                <Box sx={{ fontSize: 13, color: "#8a9088" }}>
                  {formatRequestedDate(request.createdAt)}
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    component="span"
                    sx={{
                      width: 7,
                      height: 7,
                      backgroundColor: status.dot,
                      borderRadius: "50%",
                    }}
                  />
                  <Box sx={{ fontSize: 13, color: status.color }}>{status.label}</Box>
                </Box>

                <Box sx={{ display: "flex", gap: 0.75, justifyContent: "flex-end" }}>
                  {isPending ? (
                    <>
                      <Box
                        component="button"
                        type="button"
                        disabled={busy}
                        onClick={() => onApprove(request._id)}
                        sx={{
                          px: 1.5,
                          height: 32,
                          backgroundColor: "#c8a96a",
                          border: "1px solid #c8a96a",
                          borderRadius: "5px",
                          color: "#0e1411",
                          fontFamily: "inherit",
                          fontSize: 12.5,
                          fontWeight: 600,
                          letterSpacing: "0.3px",
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "#d4b878" },
                          "&:disabled": { opacity: 0.5, cursor: "default" },
                        }}
                      >
                        {busy ? "…" : "Approve"}
                      </Box>
                      <Box
                        component="button"
                        type="button"
                        disabled={busy}
                        onClick={() => onReject(request._id)}
                        sx={{
                          px: 1.5,
                          height: 32,
                          backgroundColor: "transparent",
                          border: "1px solid #2a302c",
                          borderRadius: "5px",
                          color: "#8a9088",
                          fontFamily: "inherit",
                          fontSize: 12.5,
                          letterSpacing: "0.3px",
                          cursor: "pointer",
                          "&:hover": { borderColor: "#c87a5a", color: "#c87a5a" },
                          "&:disabled": { opacity: 0.5, cursor: "default" },
                        }}
                      >
                        Reject
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ fontSize: 12, color: "#4a4f48", letterSpacing: "0.3px" }}>
                      {request.status === "approved" ? "provisioned" : "dismissed"}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
      </Box>
    </Box>
  );
};
