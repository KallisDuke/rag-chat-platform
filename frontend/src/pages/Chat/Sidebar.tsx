import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Chat } from "./types";

interface SidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
}) => {
  return (
    <Box
      sx={{
        width: 260,
        backgroundColor: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #333",
        height: "100vh",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewChat}
          sx={{
            backgroundColor: "white",
            color: "black",
            "&:hover": { backgroundColor: "lightgray" },
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          New Chat
        </Button>
      </Box>
      <Divider sx={{ borderColor: "#333" }} />
      <List sx={{ flex: 1, overflowY: "auto", px: 1 }}>
        {chats.map((chat) => (
          <ListItem key={chat.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={activeChat?.id === chat.id}
              onClick={() => onSelectChat(chat)}
              sx={{
                borderRadius: "8px",
                backgroundColor:
                  activeChat?.id === chat.id ? "#2a2a2a" : "transparent",
                "&:hover": { backgroundColor: "#2a2a2a" },
                "&.Mui-selected": {
                  backgroundColor: "#2a2a2a",
                },
              }}
            >
              <ListItemText
                primary={chat.title}
                secondary={chat.updatedAt.toLocaleDateString()}
                sx={{
                  "& .MuiListItemText-primary": {
                    color: "#fff",
                    fontSize: "0.9rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                  "& .MuiListItemText-secondary": {
                    color: "#888",
                    fontSize: "0.75rem",
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
