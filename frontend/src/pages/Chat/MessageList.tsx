import React from "react";
import { Box } from "@mui/material";
import { Message } from "./types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  onRegenerate?: (question: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, onRegenerate }) => {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box sx={{ flex: 1, overflowY: "auto", py: 5 }}>
      <Box sx={{ maxWidth: 860, mx: "auto", px: 5, display: "flex", flexDirection: "column", gap: 5 }}>
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
                onRegenerate && isLast && precedingUser && message.content !== "..."
                  ? () => onRegenerate(precedingUser.content)
                  : undefined
              }
            />
          );
        })}
        <div ref={endRef} />
      </Box>
    </Box>
  );
};
