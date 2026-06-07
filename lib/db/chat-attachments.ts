import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ATTACH_DIR = path.join(process.cwd(), "data", "onyx-chat-attachments");
const MAX_BYTES = 2 * 1024 * 1024;

type AttachmentMeta = {
  id: string;
  sessionId: string;
  mimeType: string;
  createdAt: string;
};

export async function saveChatImageAttachment(input: {
  sessionId: string;
  base64: string;
  mimeType?: string;
}): Promise<string | null> {
  const sessionId = input.sessionId.trim();
  const raw = String(input.base64 ?? "").trim();
  if (!sessionId || !raw) return null;

  const buffer = Buffer.from(raw, "base64");
  if (!buffer.length || buffer.length > MAX_BYTES) return null;

  const id = randomUUID();
  const mimeType = input.mimeType?.trim() || "image/jpeg";
  await mkdir(ATTACH_DIR, { recursive: true });

  const meta: AttachmentMeta = {
    id,
    sessionId,
    mimeType,
    createdAt: new Date().toISOString(),
  };

  await writeFile(
    path.join(ATTACH_DIR, `${id}.meta.json`),
    JSON.stringify(meta),
    "utf8"
  );
  await writeFile(path.join(ATTACH_DIR, `${id}.bin`), buffer);

  return id;
}

export async function readChatImageAttachment(
  attachmentId: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const id = attachmentId.trim();
  if (!id || /[^a-zA-Z0-9-]/.test(id)) return null;

  try {
    const metaRaw = await readFile(
      path.join(ATTACH_DIR, `${id}.meta.json`),
      "utf8"
    );
    const meta = JSON.parse(metaRaw) as AttachmentMeta;
    const buffer = await readFile(path.join(ATTACH_DIR, `${id}.bin`));
    return {
      buffer,
      mimeType: meta.mimeType || "image/jpeg",
    };
  } catch {
    return null;
  }
}
