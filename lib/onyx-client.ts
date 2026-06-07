/** Onyx AI — istemci tarafı API sarmalayıcı */

import type { SaveQuestionToCurriculumResult } from "@/lib/db/types";
import {
  ONYX_STREAM_BUSY_MESSAGE,
  ONYX_STREAM_META_PREFIX,
  splitOnyxStreamPayload,
  type OnyxStreamMessageMetadata,
} from "@/lib/onyx/stream-protocol";
import type { OnyxEngineAction } from "@/lib/onyx-engine";
import type { OnyxContinuationContext } from "@/lib/onyx/continuity";
import type { OnyxCareerCounseling } from "@/lib/onyx/career-counseling";
import type { OnyxSkillResponse, OnyxSkillType } from "@/lib/onyx/skill-types";
import type { OnyxDeepErrorDiagnosis } from "@/lib/onyx/deep-error-diagnosis";
import type { OnyxSolveStructured } from "@/lib/onyx/solve-protocol";
import type { OnyxAiMode } from "@/lib/onyx/ai-mode";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";

export type { OnyxAiMode };

export type OnyxVisionPayload = {
  base64: string;
  mimeType: string;
};

export interface OnyxApiRequest {
  prompt: string;
  messages?: unknown[];
  contextData?: unknown;
  mode?: OnyxAiMode;
  isDeepMode?: boolean;
  hasImage?: boolean;
  deepSkillEngine?: boolean;
  academicSolution?: boolean;
  studentMode?: boolean;
  socraticTurn?: number;
  studentId?: string;
  targetStudentId?: string;
  role?: OnyxRole;
  sessionId?: string;
  action?: OnyxEngineAction;
  skillType?: OnyxSkillType;
  vision?: OnyxVisionPayload;
  continuation?: OnyxContinuationContext;
}

export type AskOnyxOptions = {
  deepSkillEngine?: boolean;
  academicSolution?: boolean;
  studentMode?: boolean;
  socraticTurn?: number;
  studentId?: string;
  targetStudentId?: string;
  role?: OnyxRole;
  sessionId?: string;
  action?: OnyxEngineAction;
  skillType?: OnyxSkillType;
  vision?: OnyxVisionPayload;
  continuation?: OnyxContinuationContext;
  isDeepMode?: boolean;
  hasImage?: boolean;
  /** Akış sırasında kısmi metin güncellemesi */
  onTextDelta?: (partialText: string) => void;
};

export interface OnyxApiSuccessResponse {
  reply: string;
  model: string;
  socraticPhase?: "probe" | "reveal";
  socraticTurn?: number;
  sessionId?: string;
  activeSkills?: string[];
  finishReason?: string | null;
  finished?: boolean;
  truncated?: boolean;
  /** Derin mod kotasında sessiz Hızlı mod geçişi */
  usedFallback?: boolean;
  careerCounseling?: OnyxCareerCounseling;
  onyxResponse?: OnyxSkillResponse;
  skillType?: OnyxSkillType;
}

/** Incomplete Response Detector — istemci tarafı */
export function onyxContinuityFromResponse(res: {
  finishReason?: string | null;
  finished?: boolean;
  truncated?: boolean;
}): { finished: boolean; truncated: boolean } {
  if (typeof res.finished === "boolean") {
    return { finished: res.finished, truncated: res.truncated ?? !res.finished };
  }
  const finished = res.finishReason === "stop";
  return { finished, truncated: !finished };
}

export function buildOnyxChatMessage(
  reply: string,
  res: {
    finishReason?: string | null;
    finished?: boolean;
    truncated?: boolean;
  }
): { role: "onyx"; content: string; truncated: boolean } {
  const { truncated } = onyxContinuityFromResponse(res);
  return { role: "onyx", content: reply, truncated };
}

export type PersistedChatMessageDto = {
  id: string;
  sessionId: string;
  role: "user" | "onyx";
  content: string;
  metadata?: string | null;
  createdAt: string;
};

export type OnyxApiErrorCode =
  | "MISSING_API_KEY"
  | "RATE_LIMIT"
  | "BAD_REQUEST"
  | "SERVER_ERROR"
  | "NETWORK_ERROR";

export interface OnyxApiErrorResponse {
  error: string;
  detail?: string;
  code?: OnyxApiErrorCode;
}

export class OnyxClientError extends Error {
  readonly code: OnyxApiErrorCode;

  constructor(message: string, code: OnyxApiErrorCode = "SERVER_ERROR") {
    super(message);
    this.name = "OnyxClientError";
    this.code = code;
  }
}

const ONYX_API_PATH = "/api/onyx";
const ONYX_VISION_API_PATH = "/api/onyx/vision";

export type OnyxVisionRequest = {
  studentId: string;
  prompt?: string;
  contextData?: unknown;
  vision?: OnyxVisionPayload;
  socraticTurn?: number;
  sessionId?: string;
  role?: OnyxRole;
};

export interface OnyxVisionSuccessResponse {
  reply: string;
  model: string;
  structured?: OnyxSolveStructured;
  deepDiagnosis?: OnyxDeepErrorDiagnosis;
  onyxResponse?: OnyxSkillResponse;
  curriculum?: SaveQuestionToCurriculumResult["curriculum"];
  solveId?: string;
  socraticPhase?: "probe" | "reveal";
  socraticTurn?: number;
  sessionId?: string;
  finishReason?: string | null;
  finished?: boolean;
  truncated?: boolean;
}

export type OnyxInsightsResponse = {
  studentId: string;
  periodDays: number;
  totalQuestions: number;
  avgDifficulty: number;
  topStrugglingTopics: Array<{
    topic: string;
    count: number;
    avgDifficulty: number;
  }>;
  dailySeries: Array<{
    date: string;
    count: number;
    avgDifficulty: number;
  }>;
  recentStruggled: Array<{
    id: string;
    topic: string;
    difficultyScore: number;
    timestamp: string;
    hasImage: boolean;
  }>;
  struggledQuestions?: Array<{
    id: string;
    topic: string;
    difficultyScore: number;
    timestamp: string;
    hasImage: boolean;
    solutionPreview: string;
  }>;
};

export type OnyxCoachSolvesResponse = {
  solves: Array<{
    id: string;
    konuBasligi: string;
    zorlukSeviyesi: number;
    hataKodu: string;
    subjectName?: string;
    topicName?: string;
    createdAt: string;
    source: string;
  }>;
  weakTopics: Array<{
    konuBasligi: string;
    subjectName?: string;
    topicName?: string;
    count: number;
    avgZorluk: number;
    hataKodlari: string[];
  }>;
  struggledQuestions?: Array<{
    id: string;
    topic: string;
    difficultyScore: number;
    timestamp: string;
    questionImage?: string | null;
    solutionText?: string;
  }>;
  deepErrorAlerts?: Array<{
    eksikKavram: string;
    konuBasligi: string;
    count: number;
    baskinHataTipi: string;
    sonTavsiye: string;
    message: string;
  }>;
};

function mapHttpError(
  status: number,
  payload: OnyxApiErrorResponse
): OnyxClientError {
  const code = payload.code;
  const message =
    payload.error ||
    payload.detail ||
    "Onyx isteği tamamlanamadı.";

  if (status === 429 || code === "RATE_LIMIT") {
    return new OnyxClientError(message, "RATE_LIMIT");
  }

  if (status === 503 || code === "MISSING_API_KEY") {
    return new OnyxClientError(
      message ||
        "Groq API anahtarı eksik. Ortam değişkeni GROQ_API_KEY tanımlanmalı.",
      "MISSING_API_KEY"
    );
  }

  if (status === 400 || code === "BAD_REQUEST") {
    return new OnyxClientError(message, "BAD_REQUEST");
  }

  return new OnyxClientError(message, code ?? "SERVER_ERROR");
}

function extractStreamingReply(raw: string): string {
  const errorIdx = raw.indexOf("\u001eONYX_ERROR\u001e");
  if (errorIdx !== -1) return raw.slice(0, errorIdx);
  const idx = raw.lastIndexOf(ONYX_STREAM_META_PREFIX);
  return idx === -1 ? raw : raw.slice(0, idx);
}

async function consumeOnyxStreamResponse(
  res: Response,
  onTextDelta?: (partialText: string) => void
): Promise<OnyxApiSuccessResponse> {
  if (!res.body) {
    throw new OnyxClientError("Akış gövdesi alınamadı.", "SERVER_ERROR");
  }

  const headerSessionId = res.headers.get("X-Onyx-Session-Id")?.trim() || undefined;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });

      const partial = extractStreamingReply(raw);
      const { streamError } = splitOnyxStreamPayload(raw);
      if (streamError) {
        throw new OnyxClientError(
          streamError,
          /limit|429|rate/i.test(streamError) ? "RATE_LIMIT" : "SERVER_ERROR"
        );
      }
      onTextDelta?.(partial);
    }
  } catch (err) {
    if (err instanceof OnyxClientError) throw err;
    throw new OnyxClientError(
      ONYX_STREAM_BUSY_MESSAGE,
      "SERVER_ERROR"
    );
  } finally {
    reader.releaseLock();
  }

  raw += decoder.decode();
  const { reply, meta, streamError } = splitOnyxStreamPayload(raw);

  if (streamError) {
    throw new OnyxClientError(
      streamError,
      /limit|429|rate/i.test(streamError) ? "RATE_LIMIT" : "SERVER_ERROR"
    );
  }

  if (!reply.trim()) {
    throw new OnyxClientError(
      meta.error ?? ONYX_STREAM_BUSY_MESSAGE,
      "SERVER_ERROR"
    );
  }

  const mergedMeta: OnyxStreamMessageMetadata = {
    sessionId: meta.sessionId ?? headerSessionId,
    ...meta,
  };

  return {
    reply,
    model: mergedMeta.model ?? "",
    sessionId: mergedMeta.sessionId ?? headerSessionId,
    socraticPhase: mergedMeta.socraticPhase,
    socraticTurn: mergedMeta.socraticTurn,
    activeSkills: mergedMeta.activeSkills,
    finishReason: mergedMeta.finishReason,
    finished: mergedMeta.finished,
    truncated: mergedMeta.truncated,
    usedFallback: mergedMeta.usedFallback,
  };
}
function buildOnyxRequestBody(
  prompt: string,
  contextData: unknown | undefined,
  mode: OnyxAiMode,
  options?: AskOnyxOptions
): OnyxApiRequest {
  const trimmed = String(prompt || "").trim();
  const hasVision = Boolean(options?.vision?.base64?.trim());
  const hasContinuation = Boolean(options?.continuation?.partialReply?.trim());
  const targetStudentId = String(
    options?.targetStudentId ?? options?.studentId ?? ""
  ).trim();

  const body: OnyxApiRequest = {
    prompt: trimmed || (hasContinuation ? "[devam]" : ""),
    mode,
    isDeepMode: options?.isDeepMode ?? mode === "DEEP",
    hasImage: options?.hasImage ?? hasVision,
    deepSkillEngine: options?.deepSkillEngine,
    academicSolution: options?.academicSolution,
    studentMode: options?.studentMode,
    socraticTurn: options?.socraticTurn,
    studentId: targetStudentId || options?.studentId,
    targetStudentId: targetStudentId || undefined,
    role: options?.role,
    sessionId: options?.sessionId,
    action: options?.action,
    skillType: options?.skillType,
    vision: options?.vision,
    continuation: options?.continuation,
  };
  if (contextData !== undefined) {
    body.contextData = contextData;
  }
  return body;
}

/**
 * Onyx API'ye prompt (+ opsiyonel öğrenci bağlamı) gönderir.
 * Yanıt SSE akışı olarak gelir; `onTextDelta` ile kelime kelime güncellenir.
 */
export async function askOnyx(
  prompt: string,
  contextData?: unknown,
  mode: OnyxAiMode = "FAST",
  options?: AskOnyxOptions
): Promise<OnyxApiSuccessResponse> {
  const trimmed = String(prompt || "").trim();
  const hasVision = Boolean(options?.vision?.base64?.trim());
  const hasContinuation = Boolean(options?.continuation?.partialReply?.trim());
  if (!trimmed && !hasVision && !hasContinuation) {
    throw new OnyxClientError(
      "Lütfen bir soru yazın veya fotoğraf yükleyin.",
      "BAD_REQUEST"
    );
  }

  const body = buildOnyxRequestBody(prompt, contextData, mode, options);

  try {
    const res = await fetch(ONYX_API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isStream =
      res.headers.get("X-Onyx-Stream") === "1" ||
      contentType.includes("text/plain");

    if (isStream) {
      if (!res.ok) {
        let data: OnyxApiErrorResponse | null = null;
        try {
          data = (await res.json()) as OnyxApiErrorResponse;
        } catch {
          /* akış gövdesi JSON olmayabilir */
        }
        throw mapHttpError(
          res.status,
          data ?? { error: ONYX_STREAM_BUSY_MESSAGE }
        );
      }
      return consumeOnyxStreamResponse(res, options?.onTextDelta);
    }

    let data: OnyxApiSuccessResponse | OnyxApiErrorResponse;
    try {
      data = (await res.json()) as OnyxApiSuccessResponse | OnyxApiErrorResponse;
    } catch {
      throw new OnyxClientError(
        "Sunucudan geçersiz yanıt alındı.",
        "SERVER_ERROR"
      );
    }

    if (!res.ok) {
      throw mapHttpError(res.status, data as OnyxApiErrorResponse);
    }

    const success = data as OnyxApiSuccessResponse;
    if (!success.reply) {
      throw new OnyxClientError(ONYX_STREAM_BUSY_MESSAGE, "SERVER_ERROR");
    }

    options?.onTextDelta?.(success.reply);
    return success;
  } catch (err) {
    if (err instanceof OnyxClientError) throw err;
    throw new OnyxClientError(
      "Ağ bağlantısı kurulamadı. İnternet bağlantınızı kontrol edin.",
      "NETWORK_ERROR"
    );
  }
}

/** Soru çözme protokolü — vision / metin (JSON + müfredat kaydı) */
export async function askOnyxVision(
  studentId: string,
  prompt: string,
  options?: {
    vision?: OnyxVisionPayload;
    socraticTurn?: number;
    sessionId?: string;
    role?: OnyxRole;
  }
): Promise<OnyxVisionSuccessResponse> {
  const trimmed = String(prompt || "").trim();
  const hasVision = Boolean(options?.vision?.base64?.trim());
  if (!studentId?.trim()) {
    throw new OnyxClientError("Öğrenci kimliği gerekli.", "BAD_REQUEST");
  }
  if (!trimmed && !hasVision) {
    throw new OnyxClientError(
      "Lütfen bir soru yazın veya fotoğraf yükleyin.",
      "BAD_REQUEST"
    );
  }

  const body: OnyxVisionRequest = {
    studentId: studentId.trim(),
    prompt: trimmed,
    vision: options?.vision,
    socraticTurn: options?.socraticTurn ?? 1,
    sessionId: options?.sessionId,
    role: options?.role,
  };

  try {
    const res = await fetch(ONYX_VISION_API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    let data: OnyxVisionSuccessResponse | OnyxApiErrorResponse;
    try {
      data = (await res.json()) as
        | OnyxVisionSuccessResponse
        | OnyxApiErrorResponse;
    } catch {
      throw new OnyxClientError(
        "Sunucudan geçersiz yanıt alındı.",
        "SERVER_ERROR"
      );
    }

    if (!res.ok) {
      throw mapHttpError(res.status, data as OnyxApiErrorResponse);
    }

    const success = data as OnyxVisionSuccessResponse;
    if (!success.reply) {
      throw new OnyxClientError("Onyx boş yanıt döndü.", "SERVER_ERROR");
    }
    return success;
  } catch (err) {
    if (err instanceof OnyxClientError) throw err;
    throw new OnyxClientError(
      "Ağ bağlantısı kurulamadı. İnternet bağlantınızı kontrol edin.",
      "NETWORK_ERROR"
    );
  }
}

export async function fetchOnyxInsights(
  studentId: string,
  days = 7
): Promise<OnyxInsightsResponse> {
  const res = await fetch(
    `/api/onyx/insights?studentId=${encodeURIComponent(studentId)}&days=${days}`
  );
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as OnyxApiErrorResponse;
    throw mapHttpError(res.status, payload);
  }
  return res.json() as Promise<OnyxInsightsResponse>;
}

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

export async function fetchOnyxChatSessions(
  studentId: string
): Promise<{ studentId: string; sessions: ChatSessionSummary[] }> {
  const res = await fetch(
    `${ONYX_API_PATH}?studentId=${encodeURIComponent(studentId)}`
  );
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as OnyxApiErrorResponse;
    throw mapHttpError(res.status, payload);
  }
  return res.json() as Promise<{
    studentId: string;
    sessions: ChatSessionSummary[];
  }>;
}

/** Öğrencinin en son Onyx oturumunu ve mesajlarını yükler */
export async function loadLatestOnyxChat(studentId: string): Promise<{
  sessionId: string;
  messages: PersistedChatMessageDto[];
} | null> {
  const res = await fetch(
    `${ONYX_API_PATH}?studentId=${encodeURIComponent(studentId)}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    sessions?: Array<{ id: string }>;
  };
  const latestId = data.sessions?.[0]?.id;
  if (!latestId) return null;
  return fetchOnyxChatSession(latestId);
}

export async function fetchOnyxChatSession(
  sessionId: string
): Promise<{ sessionId: string; messages: PersistedChatMessageDto[] }> {
  const res = await fetch(
    `${ONYX_API_PATH}?sessionId=${encodeURIComponent(sessionId)}`
  );
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as OnyxApiErrorResponse;
    throw mapHttpError(res.status, payload);
  }
  return res.json() as Promise<{
    sessionId: string;
    messages: PersistedChatMessageDto[];
  }>;
}

export async function fetchOnyxCoachSolves(
  studentId: string,
  studentName?: string
): Promise<OnyxCoachSolvesResponse> {
  const params = new URLSearchParams({ studentId });
  if (studentName?.trim()) {
    params.set("studentName", studentName.trim());
  }
  const res = await fetch(`${ONYX_VISION_API_PATH}?${params.toString()}`);
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as OnyxApiErrorResponse;
    throw mapHttpError(res.status, payload);
  }
  return res.json() as Promise<OnyxCoachSolvesResponse>;
}
