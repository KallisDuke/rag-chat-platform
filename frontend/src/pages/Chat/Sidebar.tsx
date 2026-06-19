import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, IconButton, InputBase } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Chat } from "./types";

interface SidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const groupChats = (chats: Chat[]) => {
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const groups: { label: string; chats: Chat[] }[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "Last 7 days", chats: [] },
    { label: "Older", chats: [] },
  ];

  chats.forEach((chat) => {
    const day = startOfDay(chat.updatedAt);
    if (day.getTime() === today.getTime()) groups[0].chats.push(chat);
    else if (day.getTime() === yesterday.getTime()) groups[1].chats.push(chat);
    else if (day.getTime() > weekAgo.getTime()) groups[2].chats.push(chat);
    else groups[3].chats.push(chat);
  });

  return groups.filter((g) => g.chats.length > 0);
};

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}) => {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filtered = useMemo(
    () =>
      query.trim()
        ? chats.filter((c) =>
            c.title.toLowerCase().includes(query.trim().toLowerCase()),
          )
        : chats,
    [chats, query],
  );

  const groups = useMemo(() => groupChats(filtered), [filtered]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 320 }}>
      <Box sx={{ p: 2.5 }}>
        <Button
          fullWidth
          onClick={onNewChat}
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
          sx={{
            height: 46,
            color: "#ece8df",
            border: "1px solid #2a302c",
            borderRadius: "7px",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "0.3px",
            textTransform: "none",
            "&:hover": {
              borderColor: "#c8a96a",
              color: "#c8a96a",
              backgroundColor: "transparent",
            },
          }}
        >
          New conversation
        </Button>
      </Box>

      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <Box sx={{ position: "relative", display: "flex", alignItems: "center" }}>
          <SearchIcon sx={{ position: "absolute", left: 12, fontSize: 18, color: "#6f7670" }} />
          <InputBase
            inputRef={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search history"
            sx={{
              width: "100%",
              height: 40,
              pl: 5,
              pr: 5,
              backgroundColor: "#141a16",
              border: "1px solid #1f2521",
              borderRadius: "6px",
              fontSize: 13,
              letterSpacing: "0.3px",
              color: "#ece8df",
              "&.Mui-focused": { borderColor: "#2a302c" },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              right: 10,
              fontSize: 11,
              color: "#4a4f48",
              px: 0.7,
              py: 0.2,
              border: "1px solid #1f2521",
              borderRadius: "4px",
              pointerEvents: "none",
            }}
          >
            ⌘K
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, pb: 2.5 }}>
        {groups.map((group) => (
          <Box key={group.label}>
            <Box
              sx={{
                px: 1.25,
                pt: 1.25,
                pb: 1,
                fontSize: 11,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#4a4f48",
                fontWeight: 500,
              }}
            >
              {group.label}
            </Box>
            {group.chats.map((chat) => {
              const active = activeChat?.id === chat.id;
              return (
                <Box
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 1.5,
                    mb: 0.5,
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor: active ? "#141a16" : "transparent",
                    borderLeft: active ? "3px solid #c8a96a" : "3px solid transparent",
                    "&:hover": { backgroundColor: "#141a16" },
                    "&:hover .sidebar-delete": { opacity: 1 },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box
                      sx={{
                        fontSize: 14,
                        color: active ? "#ece8df" : "#b8bdb5",
                        lineHeight: 1.3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {chat.title}
                    </Box>
                    <Box
                      sx={{
                        fontSize: 11,
                        color: "#4a4f48",
                        letterSpacing: "0.5px",
                        mt: 0.6,
                      }}
                    >
                      {chat.updatedAt.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      · {chat.messages.length} messages
                    </Box>
                  </Box>
                  <IconButton
                    className="sidebar-delete"
                    size="small"
                    aria-label="Delete chat"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    sx={{
                      opacity: 0,
                      transition: "opacity 0.15s",
                      color: "#6f7670",
                      "&:hover": { color: "#ece8df" },
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        ))}
        {groups.length === 0 && (
          <Box sx={{ px: 2, py: 4, fontSize: 13, color: "#4a4f48", textAlign: "center" }}>
            {chats.length === 0 ? "No conversations yet" : "No matches"}
          </Box>
        )}
      </Box>
    </Box>
  );
};
