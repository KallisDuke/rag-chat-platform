import React, { useEffect, useRef, useState } from "react";
import { Box, CssBaseline, Drawer, useMediaQuery } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ChatBrandBar } from "./ChatBrandBar";
import { ChatStatusBar } from "./ChatStatusBar";
import { Sidebar } from "./Sidebar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Chat, ChatTurn, FileAttachment, Message, SourceRef } from "./types";
import { API_BASE_URL } from "../../config";
import { getEmail } from "../../utils";
import {
  createConversation,
  deleteConversation,
  fetchConversations,
  fetchSuggestions,
  updateConversation,
} from "./conversationsApi";

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

const API_BASE = API_BASE_URL;

// Parse one SSE frame ("event: x\ndata: y") into its event name and data.
const parseSSEFrame = (
  frame: string,
): { event: string; data: string } | null => {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).replace(/^ /, ""));
    }
  }

  if (dataLines.length === 0) return null;

  return { event, data: dataLines.join("\n") };
};

interface StreamResult {
  content: string;
  sources?: SourceRef[];
  durationMs: number;
}

// POST the question (with prior turns + retrieval depth) and consume the SSE
// stream, invoking onUpdate with the accumulated answer (and sources) as each
// event arrives. Resolves with the final answer once the stream ends.
const streamAnswer = async (
  question: string,
  history: ChatTurn[],
  topK: number,
  onUpdate: (partial: { content?: string; sources?: SourceRef[] }) => void,
): Promise<StreamResult> => {
  const start = Date.now();
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question, history, topK }),
  });

  if (!response.ok || !response.body) {
    throw new Error("API request failed");
  }

  const reader = response.body.getReader();

  const decoder = new TextDecoder();

  let buffer = "";
  let content = "";
  let sources: SourceRef[] | undefined;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line; keep the last (possibly
    // incomplete) chunk in the buffer for the next read.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const parsed = parseSSEFrame(frame);
      if (!parsed) continue;

      if (parsed.event === "sources") {
        sources = JSON.parse(parsed.data) as SourceRef[];
        onUpdate({ sources });
      } else if (parsed.event === "token") {
        content += (JSON.parse(parsed.data) as { text: string }).text;
        onUpdate({ content });
      } else if (parsed.event === "error") {
        throw new Error(
          (JSON.parse(parsed.data) as { error?: string }).error ??
            "Stream error",
        );
      }
    }
  }

  return { content, sources, durationMs: Date.now() - start };
};

// Locally-created chats use this prefix until they are persisted and given a
// real backend id. A chat is only saved once it has its first exchange.
const isPersisted = (id: string) => !id.startsWith("local-");

// Map prior chat messages into the lightweight {role, content} turns the
// backend replays to the model (Feature 2). Drops transient placeholders.
const toHistory = (messages: Message[]): ChatTurn[] =>
  messages
    .filter((m) => !m.id.startsWith("loading-") && m.content !== "...")
    .map((m) => ({ role: m.role, content: m.content }));

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Below this width the sidebar becomes a slide-over Drawer instead of a
  // permanent column, and `sidebarOpen` drives that Drawer's open state.
  const isMobile = useMediaQuery("(max-width:900px)");
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 900,
  );
  // Composer text is lifted here so a suggestion click can pre-fill it.
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // How many chunks to retrieve per query (Feature 3 — adjustable via ChatInput).
  const [topK, setTopK] = useState(5);
  // Conversation-aware follow-up prompts shown under the input. Empty => the
  // ChatInput shows its static defaults.
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // Bumped after each completed exchange to trigger a suggestions refresh.
  const [exchangeSeq, setExchangeSeq] = useState(0);
  // Guards against stale suggestion responses winning a race when the user
  // switches chats or sends again before the previous request resolves.
  const suggestionReqRef = useRef(0);
  // Last conversation state we fetched suggestions for, to skip duplicate
  // fetches (e.g. when a new chat's id flips local- -> backend mid-settle).
  const lastSuggestionKeyRef = useRef("");

  // Load this user's saved conversations once on mount.
  useEffect(() => {
    const email = getEmail();
    if (!email) return;

    let cancelled = false;
    fetchConversations(email)
      .then((loaded) => {
        if (!cancelled) setChats(loaded);
      })
      .catch((error) => console.error("Failed to load conversations:", error));

    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh follow-up suggestions when the active chat changes or an exchange
  // completes. Reads the chat's messages directly so it isn't re-run on every
  // streamed token. Falls back to [] (static defaults) when there's no answer.
  useEffect(() => {
    if (!activeChat) {
      setSuggestions([]);
      lastSuggestionKeyRef.current = "";
      return;
    }

    const messages = activeChat.messages;
    const history = toHistory(messages);
    if (!history.some((m) => m.role === "assistant")) {
      setSuggestions([]);
      lastSuggestionKeyRef.current = "";
      return;
    }

    // Key on conversation content (not the chat id, which can change as a new
    // chat is persisted) so an unchanged conversation isn't fetched twice.
    const key = `${messages.length}:${messages[messages.length - 1]?.id ?? ""}`;
    if (key === lastSuggestionKeyRef.current) return;
    lastSuggestionKeyRef.current = key;

    const reqId = ++suggestionReqRef.current;
    fetchSuggestions(history)
      .then((next) => {
        if (reqId === suggestionReqRef.current) setSuggestions(next);
      })
      .catch((error) => {
        console.error("Failed to load suggestions:", error);
        if (reqId === suggestionReqRef.current) setSuggestions([]);
      });
    // activeChat.messages is intentionally omitted: we only refresh on chat
    // switch (id) or once an exchange settles (exchangeSeq), not per token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat?.id, exchangeSeq]);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: "local-" + Date.now().toString(),
      title: "New conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newChat);
    if (isMobile) setSidebarOpen(false);
  };

  // Selecting a chat on mobile also dismisses the slide-over sidebar.
  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    if (isMobile) setSidebarOpen(false);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    setActiveChat((prev) => (prev?.id === chatId ? null : prev));

    if (isPersisted(chatId)) {
      deleteConversation(chatId).catch((error) =>
        console.error("Failed to delete conversation:", error),
      );
    }
  };

  const applyToChat = (chatId: string, updater: (chat: Chat) => Chat) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? updater(c) : c)));
    setActiveChat((prev) => (prev?.id === chatId ? updater(prev) : prev));
  };

  // Swap a chat's temporary local id for the backend id after first save.
  const reconcileChatId = (oldId: string, newId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === oldId ? { ...c, id: newId } : c)),
    );
    setActiveChat((prev) =>
      prev?.id === oldId ? { ...prev, id: newId } : prev,
    );
  };

  // Create the conversation on first save, then update it on every change.
  const persistChat = async (chat: {
    id: string;
    title: string;
    messages: Message[];
  }) => {
    const email = getEmail();
    if (!email) return;

    try {
      if (isPersisted(chat.id)) {
        await updateConversation(chat.id, {
          title: chat.title,
          messages: chat.messages,
        });
      } else {
        const saved = await createConversation({
          email,
          title: chat.title,
          messages: chat.messages,
        });
        reconcileChatId(chat.id, saved.id);
      }
    } catch (error) {
      console.error("Failed to persist conversation:", error);
    }
  };

  // Patch a single message inside a chat — used to grow the assistant message
  // in place as streamed tokens arrive.
  const updateMessage = (
    chatId: string,
    messageId: string,
    updater: (message: Message) => Message,
  ) => {
    applyToChat(chatId, (chat) => ({
      ...chat,
      messages: chat.messages.map((m) => (m.id === messageId ? updater(m) : m)),
    }));
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
    const baseMessages = activeChat.messages;
    const history = toHistory(baseMessages);
    const title =
      baseMessages.length === 0 ? content.slice(0, 48) : activeChat.title;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
      files,
    };
    // Real (non-"loading-") id so the answer persists; starts as "..." to show
    // the typing indicator until the first token streams in.
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      content: "...",
      role: "assistant",
      timestamp: new Date(),
    };

    applyToChat(chatId, (chat) => ({
      ...chat,
      title,
      messages: [...baseMessages, userMessage, assistantMessage],
      updatedAt: new Date(),
    }));

    setIsLoading(true);
    try {
      const result = await streamAnswer(
        content,
        history,
        topK,
        ({ content: partial, sources }) => {
          updateMessage(chatId, assistantId, (m) => ({
            ...m,
            content: partial ?? m.content,
            sources: sources ?? m.sources,
          }));
        },
      );

      const finalAssistant: Message = {
        id: assistantId,
        content: result.content || "No response",
        role: "assistant",
        timestamp: new Date(),
        sources: result.sources,
        durationMs: result.durationMs,
      };

      const finalMessages = [...baseMessages, userMessage, finalAssistant];

      applyToChat(chatId, (chat) => ({
        ...chat,
        messages: finalMessages,
        updatedAt: new Date(),
      }));

      await persistChat({ id: chatId, title, messages: finalMessages });
      setExchangeSeq((n) => n + 1);
    } catch (error) {
      console.error("Error sending message:", error);

      applyToChat(chatId, (chat) => ({
        ...chat,
        messages: [...baseMessages, userMessage, errorMessage()],
        updatedAt: new Date(),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (question: string) => {
    if (!activeChat) return;
    const chatId = activeChat.id;
    const title = activeChat.title;
    const baseMessages = activeChat.messages.slice(0, -1);
    // baseMessages still ends with the user question being regenerated, so the
    // history is everything before it.
    const history = toHistory(baseMessages.slice(0, -1));
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      content: "...",
      role: "assistant",
      timestamp: new Date(),
    };

    applyToChat(chatId, (chat) => ({
      ...chat,
      messages: [...baseMessages, assistantMessage],
    }));

    setIsLoading(true);
    try {
      const result = await streamAnswer(
        question,
        history,
        topK,
        ({ content: partial, sources }) => {
          updateMessage(chatId, assistantId, (m) => ({
            ...m,
            content: partial ?? m.content,
            sources: sources ?? m.sources,
          }));
        },
      );

      const finalAssistant: Message = {
        id: assistantId,
        content: result.content || "No response",
        role: "assistant",
        timestamp: new Date(),
        sources: result.sources,
        durationMs: result.durationMs,
      };
      const finalMessages = [...baseMessages, finalAssistant];
      applyToChat(chatId, (chat) => ({
        ...chat,
        messages: finalMessages,
        updatedAt: new Date(),
      }));
      await persistChat({ id: chatId, title, messages: finalMessages });
      setExchangeSeq((n) => n + 1);
    } catch (error) {
      console.error("Error regenerating message:", error);
      applyToChat(chatId, (chat) => ({
        ...chat,
        messages: [...baseMessages, errorMessage()],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill the composer with a suggested follow-up and focus it (cursor at
  // the end) so the user can edit before sending.
  const handleSelectSuggestion = (prompt: string) => {
    setInput(prompt);
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    requestAnimationFrame(() => {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
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
          gridTemplateColumns: {
            xs: "1fr",
            md: `${sidebarOpen ? 320 : 0}px 1fr`,
          },
          gridTemplateRows: "72px 1fr",
          height: "100dvh",
          width: "100%",
          backgroundColor: "#0e1411",
          color: "#ece8df",
          transition: "grid-template-columns 0.25s ease",
          overflow: "hidden",
        }}
      >
        {!isMobile && sidebarOpen && <ChatBrandBar />}
        <ChatStatusBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />

        {!isMobile && (
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
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              onDeleteChat={handleDeleteChat}
            />
          </Box>
        )}

        <Box
          sx={{
            gridColumn: { xs: 1, md: 2 },
            gridRow: 2,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {activeChat ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: { xs: 2.5, md: 5 },
                  py: { xs: 2, md: 3 },
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
                isLoading={isLoading}
                suggestions={suggestions}
                onSelectSuggestion={handleSelectSuggestion}
              />
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
                topK={topK}
                onTopKChange={setTopK}
                input={input}
                onInputChange={setInput}
                inputRef={inputRef}
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

      {isMobile && (
        <Drawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ModalProps={{ keepMounted: true }}
          slotProps={{
            paper: {
              sx: {
                width: "min(320px, 85vw)",
                backgroundColor: "#0e1411",
                backgroundImage: "none",
                borderRight: "1px solid #1a201c",
              },
            },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box
              sx={{
                height: 72,
                flex: "none",
                display: "flex",
                "& > *": { flexGrow: 1, borderRight: "none" },
              }}
            >
              <ChatBrandBar />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <Sidebar
                chats={chats}
                activeChat={activeChat}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                onDeleteChat={handleDeleteChat}
              />
            </Box>
          </Box>
        </Drawer>
      )}
    </ThemeProvider>
  );
}
