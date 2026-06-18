import React, { useState } from "react";
import { Box, CssBaseline, IconButton, keyframes } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Chat, Message } from "./types";
import MenuIcon from "@mui/icons-material/Menu";

const dancingDots = keyframes`
  0%, 20%, 50%, 80%, 100% {
    opacity: 1;
  }
  40% {
    opacity: 0.5;
  }
  60% {
    opacity: 0.7;
  }
`;

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0d0d0d",
      paper: "#1a1a1a",
    },
    primary: {
      main: "#10a37f",
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", monospace',
  },
});

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats([newChat, ...chats]);
    setActiveChat(newChat);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats(chats.filter((chat) => chat.id !== chatId));
    if (activeChat?.id === chatId) {
      setActiveChat(null);
    }
  };

  const handleSendMessage = async (content: string, files?: any[]) => {
    if (!activeChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
      files: files,
    };

    const updatedChat = {
      ...activeChat,
      messages: [...activeChat.messages, newMessage],
      updatedAt: new Date(),
    };

    setActiveChat(updatedChat);
    setChats(
      chats.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat)),
    );

    // Add loading message
    setIsLoading(true);
    const loadingMessage: Message = {
      id: "loading-" + Date.now().toString(),
      content: "...",
      role: "assistant",
      timestamp: new Date(),
    };

    const chatWithLoading = {
      ...updatedChat,
      messages: [...updatedChat.messages, loadingMessage],
    };
    setActiveChat(chatWithLoading);

    // Send message to API
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: content,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer || "No response",
        role: "assistant",
        timestamp: new Date(),
      };

      // Remove loading message and add actual response
      const finalMessages = chatWithLoading.messages.filter(
        (msg) => !msg.id.startsWith("loading-"),
      );
      const finalChat = {
        ...chatWithLoading,
        messages: [...finalMessages, assistantMessage],
        updatedAt: new Date(),
      };

      setActiveChat(finalChat);
      setChats(
        chats.map((chat) => (chat.id === finalChat.id ? finalChat : chat)),
      );
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, there was an error processing your request.",
        role: "assistant",
        timestamp: new Date(),
      };

      // Remove loading message and add error message
      const finalMessages = chatWithLoading.messages.filter(
        (msg) => !msg.id.startsWith("loading-"),
      );
      const errorChat = {
        ...chatWithLoading,
        messages: [...finalMessages, errorMessage],
        updatedAt: new Date(),
      };

      setActiveChat(errorChat);
      setChats(
        chats.map((chat) => (chat.id === errorChat.id ? errorChat : chat)),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          backgroundColor: "#0d0d0d",
        }}
      >
        <Navbar />
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <Box
            sx={{
              width: sidebarOpen ? 260 : 0,
              overflow: "hidden",
              transition: "width 0.3s ease",
            }}
          >
            <Sidebar
              chats={chats}
              activeChat={activeChat}
              onSelectChat={setActiveChat}
              onNewChat={handleNewChat}
              onDeleteChat={handleDeleteChat}
            />
          </Box>
          <Box sx={{ p: 1 }}>
            <IconButton
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ color: "white" }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#0d0d0d",
            }}
          >
            {activeChat ? (
              <>
                <MessageList messages={activeChat.messages} />
                <ChatInput onSendMessage={handleSendMessage} />
              </>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#888",
                  fontSize: "1.1rem",
                }}
              >
                Select or create a chat to start
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
