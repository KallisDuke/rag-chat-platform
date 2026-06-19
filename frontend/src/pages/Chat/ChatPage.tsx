import React, { useState } from "react";
import { Box, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ChatBrandBar } from "./ChatBrandBar";
import { ChatStatusBar } from "./ChatStatusBar";
import { Sidebar } from "./Sidebar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Chat, FileAttachment, Message, SourceRef } from "./types";

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

const API_BASE = "http://localhost:3000";

interface QueryResult {
  answer: string;
  sources?: SourceRef[];
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newChat);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    setActiveChat((prev) => (prev?.id === chatId ? null : prev));
  };

  const applyToChat = (chatId: string, updater: (chat: Chat) => Chat) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? updater(c) : c)));
    setActiveChat((prev) => (prev?.id === chatId ? updater(prev) : prev));
  };

  const fetchAnswer = async (question: string): Promise<Message> => {
    const start = Date.now();
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data: QueryResult = await response.json();
    return {
      id: (Date.now() + 1).toString(),
      content: data.answer || "No response",
      role: "assistant",
      timestamp: new Date(),
      sources: data.sources,
      durationMs: Date.now() - start,
    };
  };

  const errorMessage = (): Message => ({
    id: (Date.now() + 1).toString(),
    content: "Sorry, there was an error processing your request.",
    role: "assistant",
    timestamp: new Date(),
  });

  const handleSendMessage = async (
    content: string,
    files?: FileAttachment[],
  ) => {
    if (!activeChat) return;
    const chatId = activeChat.id;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
      files,
    };
    const loadingMessage: Message = {
      id: "loading-" + Date.now().toString(),
      content: "...",
      role: "assistant",
      timestamp: new Date(),
    };

    applyToChat(chatId, (chat) => ({
      ...chat,
      title: chat.messages.length === 0 ? content.slice(0, 48) : chat.title,
      messages: [...chat.messages, userMessage, loadingMessage],
      updatedAt: new Date(),
    }));

    setIsLoading(true);
    try {
      const assistantMessage = await fetchAnswer(content);
      applyToChat(chatId, (chat) => ({
        ...chat,
        messages: [
          ...chat.messages.filter((m) => !m.id.startsWith("loading-")),
          assistantMessage,
        ],
        updatedAt: new Date(),
      }));
    } catch (error) {
      console.error("Error sending message:", error);
      applyToChat(chatId, (chat) => ({
        ...chat,
        messages: [
          ...chat.messages.filter((m) => !m.id.startsWith("loading-")),
          errorMessage(),
        ],
        updatedAt: new Date(),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (question: string) => {
    if (!activeChat) return;
    const chatId = activeChat.id;
    const loadingMessage: Message = {
      id: "loading-" + Date.now().toString(),
      content: "...",
      role: "assistant",
      timestamp: new Date(),
    };

    applyToChat(chatId, (chat) => ({
      ...chat,
      messages: [...chat.messages.slice(0, -1), loadingMessage],
    }));

    setIsLoading(true);
    try {
      const assistantMessage = await fetchAnswer(question);
      applyToChat(chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages.slice(0, -1), assistantMessage],
        updatedAt: new Date(),
      }));
    } catch (error) {
      console.error("Error regenerating message:", error);
      applyToChat(chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages.slice(0, -1), errorMessage()],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const sourcesCited = activeChat
    ? new Set(
        activeChat.messages.flatMap(
          (m) => m.sources?.map((s) => s.source) ?? [],
        ),
      ).size
    : 0;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `${sidebarOpen ? 320 : 0}px 1fr`,
          gridTemplateRows: "72px 1fr",
          height: "100vh",
          width: "100%",
          backgroundColor: "#0e1411",
          color: "#ece8df",
          transition: "grid-template-columns 0.25s ease",
          overflow: "hidden",
        }}
      >
        {sidebarOpen && <ChatBrandBar />}
        <ChatStatusBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />

        <Box
          sx={{
            gridColumn: 1,
            gridRow: 2,
            overflow: "hidden",
            borderRight: sidebarOpen ? "1px solid #1a201c" : "none",
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

        <Box
          sx={{
            gridColumn: 2,
            gridRow: 2,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {activeChat ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 5,
                  py: 3,
                  borderBottom: "1px solid #1a201c",
                }}
              >
                <Box>
                  <Box
                    sx={{
                      fontSize: 16,
                      color: "#ece8df",
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    {activeChat.title}
                  </Box>
                  <Box
                    sx={{
                      fontSize: 12,
                      color: "#6f7670",
                      letterSpacing: "0.5px",
                      mt: 0.5,
                    }}
                  >
                    started{" "}
                    {activeChat.createdAt.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {activeChat.messages.length} messages
                    {sourcesCited > 0 && ` · ${sourcesCited} sources cited`}
                  </Box>
                </Box>
              </Box>
              <MessageList
                messages={activeChat.messages}
                onRegenerate={handleRegenerate}
              />
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
              />
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                color: "#6f7670",
              }}
            >
              <Box sx={{ fontSize: 15, letterSpacing: "0.3px" }}>
                Select or start a conversation
              </Box>
              <Box
                component="button"
                type="button"
                onClick={handleNewChat}
                sx={{
                  backgroundColor: "transparent",
                  border: "1px solid #2a302c",
                  borderRadius: "7px",
                  color: "#c8a96a",
                  fontFamily: "inherit",
                  fontSize: 14,
                  px: 2.5,
                  py: 1.25,
                  cursor: "pointer",
                  "&:hover": { borderColor: "#c8a96a" },
                }}
              >
                New conversation
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
