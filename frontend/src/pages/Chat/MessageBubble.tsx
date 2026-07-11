import React, { useState } from "react";
import { Box, IconButton, Typography, keyframes } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ReplayIcon from "@mui/icons-material/Replay";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Message, SourceRef } from "./types";

const typingBar = keyframes`
  0% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
  100% { transform: scaleY(0.3); }
`;

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  // Opens the citation's original document in the side viewer.
  onOpenCitation?: (source: SourceRef) => void;
}

// Render the answer text with inline [n] citation markers turned into buttons
// that open the cited document. Markers without a matching source (or when no
// viewer callback is wired) render as plain text.
const renderAnswerText = (
  content: string,
  sources: SourceRef[] | undefined,
  onOpenCitation?: (source: SourceRef) => void,
): React.ReactNode => {
  if (!onOpenCitation || !sources || sources.length === 0) return content;

  return content.split(/(\[\d+\])/g).map((part, i) => {
    const marker = part.match(/^\[(\d+)\]$/);
    const source = marker ? sources[Number(marker[1]) - 1] : undefined;

    if (!source) return <React.Fragment key={i}>{part}</React.Fragment>;

    return (
      <Box
        key={i}
        component="button"
        type="button"
        title={`open ${source.source}${
          typeof source.pageNumber === "number"
            ? ` at page ${source.pageNumber}`
            : ""
        }`}
        onClick={() => onOpenCitation(source)}
        sx={{
          background: "none",
          border: "none",
          p: 0,
          font: "inherit",
          color: "#c8a96a",
          fontWeight: 600,
          cursor: "pointer",
          "&:hover": { textDecoration: "underline" },
        }}
      >
        {part}
      </Box>
    );
  });
};

const TypingIndicator: React.FC = () => (
  <Box sx={{ display: "flex", alignItems: "center", height: 18, gap: "4px" }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 4,
          height: 18,
          backgroundColor: "#c8a96a",
          borderRadius: "1px",
          animation: `${typingBar} 1s ease-in-out infinite`,
          animationDelay: `${i * 0.15}s`,
        }}
      />
    ))}
  </Box>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRegenerate,
  onOpenCitation,
}) => {
  const isUser = message.role === "user";
  const isLoading = message.content === "...";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  // Which citation's matched snippet is expanded (Feature 3); null = none.
  const [expandedSource, setExpandedSource] = useState<number | null>(null);

  const timeLabel = message.timestamp.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (isUser) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, fontSize: 12, letterSpacing: "0.5px", color: "#6f7670" }}>
          <span>you</span>
          <span>·</span>
          <span>{timeLabel}</span>
        </Box>
        <Box
          sx={{
            backgroundColor: "#1a201c",
            color: "#ece8df",
            px: 2.5,
            py: 1.75,
            borderRadius: "10px 10px 2px 10px",
            fontSize: 15,
            lineHeight: 1.55,
            maxWidth: 560,
            whiteSpace: "pre-wrap",
          }}
        >
          {message.content}
        </Box>
        {message.files && message.files.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {message.files.map((file, i) => (
              <Box
                key={i}
                sx={{
                  fontSize: 12,
                  color: "#6f7670",
                  border: "1px solid #1f2521",
                  borderRadius: "5px",
                  px: 1.25,
                  py: 0.5,
                }}
              >
                {file.name}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, fontSize: 12, letterSpacing: "0.5px", color: "#6f7670" }}>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
          <Box component="span" sx={{ width: 6, height: 6, backgroundColor: "#c8a96a", borderRadius: "50%" }} />
          <Box component="span" sx={{ color: "#c8a96a" }}>
            kallis
          </Box>
        </Box>
        <span>·</span>
        <span>{timeLabel}</span>
        {!isLoading && message.sources && message.sources.length > 0 && (
          <>
            <span>·</span>
            <span>
              retrieved {message.sources.length} chunk
              {message.sources.length === 1 ? "" : "s"}
            </span>
          </>
        )}
        {!isLoading && typeof message.durationMs === "number" && (
          <>
            <span>·</span>
            <span>
              {message.durationMs < 1000
                ? `${message.durationMs}ms`
                : `${(message.durationMs / 1000).toFixed(1)}s`}
            </span>
          </>
        )}
      </Box>

      {isLoading ? (
        <TypingIndicator />
      ) : (
        <>
          {message.sources && message.sources.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, maxWidth: 700, width: "100%" }}>
              <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
                {message.sources.map((s, i) => {
                  const hasDetail =
                    Boolean(s.content) || typeof s.score === "number";
                  const isOpen = expandedSource === i;
                  return (
                    <Box
                      key={i}
                      component="button"
                      type="button"
                      onClick={
                        hasDetail
                          ? () => setExpandedSource(isOpen ? null : i)
                          : undefined
                      }
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 0.75,
                        backgroundColor: isOpen ? "#1a201c" : "#141a16",
                        border: "1px solid",
                        borderColor: isOpen ? "#2a302c" : "#1f2521",
                        borderRadius: "5px",
                        fontFamily: "inherit",
                        fontSize: 12,
                        letterSpacing: "0.3px",
                        color: "#b8bdb5",
                        cursor: hasDetail ? "pointer" : "default",
                        "&:hover": hasDetail
                          ? { borderColor: "#2a302c", color: "#ece8df" }
                          : {},
                      }}
                    >
                      <Box component="span" sx={{ color: "#c8a96a", fontWeight: 600 }}>
                        [{i + 1}]
                      </Box>
                      <span>{String(s.source)}</span>
                      {typeof s.pageNumber === "number" && (
                        <Box component="span" sx={{ color: "#6f7670" }}>
                          p.{s.pageNumber}
                        </Box>
                      )}
                      {typeof s.score === "number" && (
                        <Box component="span" sx={{ color: "#6f7670" }}>
                          {s.score.toFixed(3)}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>

              {expandedSource !== null &&
                message.sources[expandedSource]?.content && (
                  <Box
                    sx={{
                      p: 1.75,
                      backgroundColor: "#0e1411",
                      border: "1px solid #1f2521",
                      borderRadius: "6px",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                        fontSize: 11,
                        letterSpacing: "0.5px",
                        color: "#6f7670",
                      }}
                    >
                      <Box component="span" sx={{ color: "#c8a96a", fontWeight: 600 }}>
                        [{expandedSource + 1}]
                      </Box>
                      <span>{String(message.sources[expandedSource].source)}</span>
                      {typeof message.sources[expandedSource].score ===
                        "number" && (
                        <>
                          <span>·</span>
                          <span>
                            score{" "}
                            {message.sources[expandedSource].score!.toFixed(3)}
                          </span>
                        </>
                      )}
                      {onOpenCitation && (
                        <Box
                          component="button"
                          type="button"
                          onClick={() =>
                            onOpenCitation(message.sources![expandedSource])
                          }
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            ml: "auto",
                            background: "none",
                            border: "none",
                            p: 0,
                            fontFamily: "inherit",
                            fontSize: 11,
                            letterSpacing: "0.5px",
                            color: "#c8a96a",
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          <OpenInNewIcon sx={{ fontSize: 13 }} />
                          {typeof message.sources[expandedSource]
                            .pageNumber === "number"
                            ? `open at page ${message.sources[expandedSource].pageNumber}`
                            : "open document"}
                        </Box>
                      )}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "#9aa097",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {message.sources[expandedSource].content}
                    </Typography>
                  </Box>
                )}
            </Box>
          )}

          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#d8d4c8", maxWidth: 700, whiteSpace: "pre-wrap" }}>
            {renderAnswerText(message.content, message.sources, onOpenCitation)}
          </Typography>

          <Box sx={{ display: "flex", gap: 0.75, mt: 0.5 }}>
            <IconButton
              size="small"
              title="copy"
              onClick={handleCopy}
              sx={{ color: copied ? "#c8a96a" : "#6f7670", "&:hover": { color: "#ece8df" } }}
            >
              <ContentCopyIcon sx={{ fontSize: 18 }} />
            </IconButton>
            {onRegenerate && (
              <IconButton
                size="small"
                title="regenerate"
                onClick={onRegenerate}
                sx={{ color: "#6f7670", "&:hover": { color: "#ece8df" } }}
              >
                <ReplayIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            <IconButton
              size="small"
              title="good"
              onClick={() => setFeedback("up")}
              sx={{ color: feedback === "up" ? "#c8a96a" : "#6f7670", "&:hover": { color: "#ece8df" } }}
            >
              <ThumbUpOffAltIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              size="small"
              title="bad"
              onClick={() => setFeedback("down")}
              sx={{ color: feedback === "down" ? "#c8a96a" : "#6f7670", "&:hover": { color: "#ece8df" } }}
            >
              <ThumbDownOffAltIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  );
};
