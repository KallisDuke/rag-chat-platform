import type { ChatTurn } from "../services/rag.ts";

// Keep only well-formed conversation turns before sending them to the model —
// never transient UI state (e.g. "..." placeholders) or malformed entries.
export const sanitizeHistory = (history: unknown): ChatTurn[] => {
  if (!Array.isArray(history)) return [];

  return history.filter(
    (t): t is ChatTurn =>
      Boolean(t) &&
      (t.role === "user" || t.role === "assistant") &&
      typeof t.content === "string" &&
      t.content.trim() !== "" &&
      t.content !== "...",
  );
};
