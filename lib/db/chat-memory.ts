import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { saveChatImageAttachment } from "@/lib/db/chat-attachments";
import { getPrisma } from "@/lib/db/prisma";
import {
  parseOnyxMessageMetadata,
  serializeOnyxMessageMetadata,
  type OnyxChatMessageMetadata,
} from "@/lib/onyx/chat-message-metadata";

const FALLBACK_FILE = path.join(process.cwd(), "data", "chat-sessions.json");

export type ChatMessageRole = "user" | "onyx";

export type PersistedChatMessage = {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  metadata?: string | null;
  createdAt: string;
};

export type ChatSessionSummary = {
  id: string;
  studentId: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  title: string;
  preview: string;
  hasImage: boolean;
};

type FallbackStore = {
  version: 1;
  sessions: Array<{
    id: string;
    studentId: string;
    createdAt: string;
  }>;
  messages: PersistedChatMessage[];
};

function newId(): string {
  return randomUUID();
}

function truncate(text: string, max: number): string {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t || "Yeni sohbet";
  return `${t.slice(0, max - 1)}…`;
}

function sessionHasImage(messages: PersistedChatMessage[]): boolean {
  return messages.some((m) => {
    const meta = parseOnyxMessageMetadata(m.metadata);
    return Boolean(meta?.hasImage || meta?.imageAttachmentId);
  });
}

function buildSessionSummary(
  session: { id: string; studentId: string; createdAt: string },
  messages: PersistedChatMessage[]
): ChatSessionSummary {
  const sorted = [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const firstUser = sorted.find((m) => m.role === "user");
  const last = sorted[sorted.length - 1];
  const titleSource = firstUser?.content || last?.content || "Yeni sohbet";

  return {
    id: session.id,
    studentId: session.studentId,
    createdAt: session.createdAt,
    lastMessageAt: last?.createdAt ?? session.createdAt,
    messageCount: sorted.length,
    title: truncate(titleSource, 52),
    preview: truncate(
      last?.role === "onyx" ? last.content : last?.content ?? "",
      80
    ),
    hasImage: sessionHasImage(sorted),
  };
}

async function readFallback(): Promise<FallbackStore> {
  try {
    const raw = await readFile(FALLBACK_FILE, "utf8");
    const parsed = JSON.parse(raw) as FallbackStore;
    if (parsed?.version === 1 && Array.isArray(parsed.sessions)) {
      return {
        version: 1,
        sessions: parsed.sessions ?? [],
        messages: parsed.messages ?? [],
      };
    }
  } catch {
    /* yok */
  }
  return { version: 1, sessions: [], messages: [] };
}

async function writeFallback(store: FallbackStore): Promise<void> {
  await mkdir(path.dirname(FALLBACK_FILE), { recursive: true });
  await writeFile(FALLBACK_FILE, JSON.stringify(store, null, 2), "utf8");
}

function normalizeRole(role: string): ChatMessageRole {
  return role === "user" ? "user" : "onyx";
}

function mapPrismaMessage(row: {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  metadata: string | null;
  createdAt: Date;
}): PersistedChatMessage {
  return {
    id: row.id,
    sessionId: row.sessionId,
    role: normalizeRole(row.role),
    content: row.content,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Oturum yoksa oluşturur; geçersiz sessionId ise yeni oturum açar */
export async function resolveChatSession(
  studentId: string,
  sessionId?: string | null
): Promise<string> {
  const sid = studentId.trim();
  if (!sid) throw new Error("studentId gerekli");

  const prisma = getPrisma();
  if (prisma) {
    if (sessionId?.trim()) {
      const existing = await prisma.chatSession.findFirst({
        where: { id: sessionId.trim(), studentId: sid },
      });
      if (existing) return existing.id;
    }
    const created = await prisma.chatSession.create({
      data: { studentId: sid },
    });
    return created.id;
  }

  const store = await readFallback();
  if (sessionId?.trim()) {
    const hit = store.sessions.find(
      (s) => s.id === sessionId.trim() && s.studentId === sid
    );
    if (hit) return hit.id;
  }
  const id = newId();
  store.sessions.unshift({
    id,
    studentId: sid,
    createdAt: new Date().toISOString(),
  });
  await writeFallback(store);
  return id;
}

export async function appendChatMessage(
  sessionId: string,
  role: ChatMessageRole,
  content: string,
  messageMetadata?: OnyxChatMessageMetadata | null
): Promise<PersistedChatMessage> {
  const text = String(content ?? "").trim();
  if (!text) throw new Error("Mesaj içeriği boş");

  const metadata = serializeOnyxMessageMetadata(messageMetadata);

  const prisma = getPrisma();
  if (prisma) {
    const row = await prisma.message.create({
      data: {
        sessionId,
        role: normalizeRole(role),
        content: text,
        metadata: metadata ?? null,
      },
    });
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
    return mapPrismaMessage(row);
  }

  const store = await readFallback();
  const record: PersistedChatMessage = {
    id: newId(),
    sessionId,
    role: normalizeRole(role),
    content: text,
    metadata: metadata ?? null,
    createdAt: new Date().toISOString(),
  };
  store.messages.push(record);
  if (store.messages.length > 20_000) {
    store.messages = store.messages.slice(-20_000);
  }
  await writeFallback(store);
  return record;
}

/** Kullanıcı + Onyx mesaj çiftini kalıcı belleğe yazar */
export async function persistChatExchange(input: {
  studentId: string;
  sessionId?: string | null;
  userContent: string;
  onyxContent: string;
  userImage?: { base64: string; mimeType?: string };
  userMetadata?: OnyxChatMessageMetadata;
  onyxMetadata?: OnyxChatMessageMetadata;
}): Promise<{ sessionId: string }> {
  const sessionId = await resolveChatSession(
    input.studentId,
    input.sessionId
  );

  let userMeta: OnyxChatMessageMetadata | undefined = input.userMetadata;

  if (input.userImage?.base64?.trim()) {
    const attachmentId = await saveChatImageAttachment({
      sessionId,
      base64: input.userImage.base64,
      mimeType: input.userImage.mimeType,
    });
    if (attachmentId) {
      userMeta = {
        ...userMeta,
        hasImage: true,
        imageAttachmentId: attachmentId,
      };
    }
  }

  await appendChatMessage(sessionId, "user", input.userContent, userMeta);
  await appendChatMessage(
    sessionId,
    "onyx",
    input.onyxContent,
    input.onyxMetadata
  );
  return { sessionId };
}

export async function listChatMessages(
  sessionId: string
): Promise<PersistedChatMessage[]> {
  const prisma = getPrisma();
  if (prisma) {
    const rows = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapPrismaMessage);
  }

  const store = await readFallback();
  return store.messages
    .filter((m) => m.sessionId === sessionId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export async function listStudentChatSessions(
  studentId: string,
  limit = 30
): Promise<ChatSessionSummary[]> {
  const sid = studentId.trim();
  const prisma = getPrisma();

  if (prisma) {
    const sessions = await prisma.chatSession.findMany({
      where: { studentId: sid },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    return sessions.map((s) =>
      buildSessionSummary(
        {
          id: s.id,
          studentId: s.studentId,
          createdAt: s.createdAt.toISOString(),
        },
        s.messages.map(mapPrismaMessage)
      )
    );
  }

  const store = await readFallback();
  return store.sessions
    .filter((s) => s.studentId === sid)
    .slice(0, limit)
    .map((s) => {
      const msgs = store.messages.filter((m) => m.sessionId === s.id);
      return buildSessionSummary(s, msgs);
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );
}
