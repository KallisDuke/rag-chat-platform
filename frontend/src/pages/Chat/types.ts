export interface FileAttachment {
  name: string;
  size: number;
  type: string;
  data?: string; // base64 for preview
}

export interface SourceRef {
  source: string;
  // Present on freshly-retrieved sources (Feature 3); older persisted
  // conversations may only have `source`.
  content?: string;
  score?: number;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  files?: FileAttachment[];
  sources?: SourceRef[];
  durationMs?: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
