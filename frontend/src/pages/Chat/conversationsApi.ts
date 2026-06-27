import { API_BASE_URL } from "../../config";
import { Chat, Message } from "./types";

// Shape returned by the backend; timestamps arrive as ISO strings over JSON.
interface ConversationDTO {
  id: string;
  email: string;
  title: string;
  messages: (Omit<Message, "timestamp"> & { timestamp: string })[];
  createdAt: string;
  updatedAt: string;
}

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Drop transient/loading messages and heavy base64 file previews before
// persisting — only metadata is stored for attachments.
const sanitizeMessages = (messages: Message[]) =>
  messages
    .filter((m) => !m.id.startsWith("loading-"))
    .map((m) => ({
      ...m,
      files: m.files?.map(({ name, size, type }) => ({ name, size, type })),
    }));

const toChat = (dto: ConversationDTO): Chat => ({
  id: dto.id,
  title: dto.title,
  messages: dto.messages.map((m) => ({
    ...m,
    timestamp: new Date(m.timestamp),
  })),
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

export const fetchConversations = async (email: string): Promise<Chat[]> => {
  const res = await fetch(
    `${API_BASE_URL}/conversations?email=${encodeURIComponent(email)}`,
    { headers: authHeaders() },
  );

  if (!res.ok) throw new Error("Failed to load conversations");

  const data: { conversations: ConversationDTO[] } = await res.json();
  return data.conversations.map(toChat);
};

export const createConversation = async (input: {
  email: string;
  title: string;
  messages: Message[];
}): Promise<Chat> => {
  const res = await fetch(`${API_BASE_URL}/conversations`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: input.email,
      title: input.title,
      messages: sanitizeMessages(input.messages),
    }),
  });

  if (!res.ok) throw new Error("Failed to create conversation");

  const data: { conversation: ConversationDTO } = await res.json();
  return toChat(data.conversation);
};

export const updateConversation = async (
  id: string,
  input: { title: string; messages: Message[] },
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/conversations/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
      title: input.title,
      messages: sanitizeMessages(input.messages),
    }),
  });

  if (!res.ok) throw new Error("Failed to update conversation");
};

export const deleteConversation = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/conversations/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("Failed to delete conversation");
};
