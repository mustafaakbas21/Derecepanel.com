import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export { DP_SESSION_COOKIE } from "@/lib/auth/cookie-names";

const TTL_SEC = 60 * 60 * 24 * 7;

export type DpSessionPayload = {
  userId: string;
  role: "coach" | "student" | "admin";
  email: string;
  username?: string;
  exp: number;
};

function signingKey(): string {
  const sessionSecret = process.env.SESSION_SIGNING_SECRET?.trim();
  if (sessionSecret) return sessionSecret;

  const apiKey = process.env.APPWRITE_API_KEY?.trim();
  if (apiKey) {
    return createHash("sha256").update(`${apiKey}:dp-session-v1`).digest("hex");
  }

  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "derecepanel";
  return createHash("sha256").update(`${projectId}:dp-session-fallback-v1`).digest("hex");
}

function sign(data: string): string {
  return createHmac("sha256", signingKey()).update(data).digest("base64url");
}

export function signDpSession(
  payload: Omit<DpSessionPayload, "exp">
): string {
  const body: DpSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TTL_SEC,
  };
  const data = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyDpSession(
  token: string | null | undefined
): DpSessionPayload | null {
  if (!token?.includes(".")) return null;
  const dot = token.lastIndexOf(".");
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!data || !sig) return null;

  let expected: string;
  try {
    expected = sign(data);
  } catch {
    return null;
  }
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as DpSessionPayload;
    if (!payload.userId || !payload.role) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== "coach" && payload.role !== "student" && payload.role !== "admin") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
