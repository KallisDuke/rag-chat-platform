import React from "react";
import { Box } from "@mui/material";
import { Message } from "./types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  onRegenerate?: (question: string) => void;
  isLoading?: boolean;
  // Conversation-aware follow-up prompts, shown under the latest answer.
  suggestions?: string[];
  onSelectSuggestion?: (prompt: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onRegenerate,
  isLoading,
  suggestions,
  onSelectSuggestion,
}) => {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestions]);

  const lastMessage = messages[messages.length - 1];
  // Only offer follow-ups once the latest answer has settled (not mid-stream).
  const showSuggestions =
    !isLoading &&
    !!suggestions &&
    suggestions.length > 0 &&
    lastMessage?.role === "assistant" &&
    lastMessage.content !== "...";

  return (
    <Box sx={{ flex: 1, overflowY: "auto", py: { xs: 3, md: 5 } }}>
      <Box
        sx={{
          maxWidth: 860,
          mx: "auto",
          px: { xs: 2.5, md: 5 },
          display: "flex",
          flexDirection: "column",
          gap: { xs: 4, md: 5 },
        }}
      >
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const precedingUser =
            message.role === "assistant"
              ? [...messages.slice(0, index)].reverse().find((m) => m.role === "user")
              : undefined;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              onRegenerate={
                onRegenerate &&
                isLast &&
                precedingUser &&
                message.content !== "..." &&
                !isLoading
                  ? () => onRegenerate(precedingUser.content)
                  : undefined
              }
            />
          );
        })}

        {showSuggestions && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: -2 }}>
            <Box
              sx={{
                fontSize: 12,
                letterSpacing: "0.5px",
                color: "#6f7670",
              }}
            >
              suggested follow-ups
            </Box>
            <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
              {suggestions!.map((prompt) => (
                <Box
                  key={prompt}
                  component="button"
                  type="button"
                  onClick={() => onSelectSuggestion?.(prompt)}
                  sx={{
                    backgroundColor: "transparent",
                    border: "1px solid #1f2521",
                    borderRadius: "5px",
                    px: 1.5,
                    py: 0.75,
                    color: "#6f7670",
                    fontFamily: "inherit",
                    fontSize: 12,
                    letterSpacing: "0.4px",
                    textAlign: "left",
                    cursor: "pointer",
                    "&:hover": { borderColor: "#2a302c", color: "#ece8df" },
                  }}
                >
                  {prompt}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <div ref={endRef} />
      </Box>
    </Box>
  );
};
