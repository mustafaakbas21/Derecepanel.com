import { ONYX_CHAT_TURN_MAX_CHARS } from "@/lib/onyx/prompt-budget";

/** Groq TPM sınırı — API'ye gönderilecek maksimum geçmiş tur */
export const ONYX_CHAT_HISTORY_MAX_MESSAGES = 3;

export type OnyxChatHistoryTurn = {
  role: "user" | "assistant";
  content: string;
};

function normalizeRole(raw: unknown): "user" | "assistant" | null {
  const role = String(raw ?? "").toLowerCase();
  if (role === "user") return "user";
  if (role === "assistant" || role === "onyx") return "assistant";
  return null;
}

/** Ham mesaj listesini Groq formatına çevirip son N mesaja kırpar */
export function pruneOnyxChatHistory(
  messages: unknown[],
  maxMessages: number = ONYX_CHAT_HISTORY_MAX_MESSAGES
): OnyxChatHistoryTurn[] {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const normalized: OnyxChatHistoryTurn[] = [];
  for (const item of messages) {
    if (!item || typeof item !== "object") continue;
    const row = item as { role?: unknown; content?: unknown };
    const role = normalizeRole(row.role);
    const content = String(row.content ?? "").trim();
    if (!role || !content) continue;
    const clipped =
      content.length > ONYX_CHAT_TURN_MAX_CHARS
        ? `${content.slice(0, ONYX_CHAT_TURN_MAX_CHARS)}…`
        : content;
    normalized.push({ role, content: clipped });
  }

  return normalized.slice(-maxMessages);
}
