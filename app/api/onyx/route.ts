import { NextResponse } from "next/server";

/** YouTube transcript fetch — Node ortamı gerekir */
export const runtime = "nodejs";

import {
  getChatSessionStudentId,
  listChatMessages,
  listStudentChatSessions,
} from "@/lib/db/chat-memory";
import {
  getOnyxEngine,
  type OnyxEngineAction,
} from "@/lib/onyx-engine";
import { normalizeOnyxAiMode } from "@/lib/onyx/ai-mode";
import {
  pruneOnyxChatHistory,
  type OnyxChatHistoryTurn,
} from "@/lib/onyx/chat-history-pruning";
import { prependOnyxIntentRecognition } from "@/lib/onyx/intent-recognition";
import { AuthError } from "@/lib/auth/require-coach";
import {
  assertOnyxStudentAccess,
  requireOnyxAuth,
} from "@/lib/auth/require-onyx";
import { enforceRateLimit } from "@/lib/security/apply-rate-limit";
import { OnyxGroqError } from "@/lib/onyx/groq-server";
import { resolveOnyxGroqModelSafe } from "@/lib/onyx/resolve-groq-model";
import {
  onyxStreamErrorResponse,
  runOnyxStreamResponse,
} from "@/lib/onyx/run-onyx-stream";
import type { OnyxContinuationContext } from "@/lib/onyx/continuity";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import type { OnyxActionType } from "@/lib/onyx/types";
import { isCareerIntentText } from "@/lib/onyx/career-counseling";
import { isStrategyIntentText } from "@/lib/onyx/strategy-intent";
import { isMentalIntentText } from "@/lib/onyx/mental-intent";
import {
  buildCareerRagContext,
  mergeCareerIntoStudentContext,
} from "@/lib/onyx/career-rag-server";
import { fetchLatestDenemeNetsFromAppwrite } from "@/lib/appwrite/deneme-nets-server";
import { mergeSupabaseDenemeIntoContext } from "@/lib/onyx/merge-supabase-deneme-context";
import {
  resolveSkillType,
  skillTypeToAction,
} from "@/lib/onyx/skill-router";
import type { OnyxSkillType } from "@/lib/onyx/skill-types";
import {
  buildCurriculumRagForSolve,
  isSolveCurriculumAction,
  mergeCurriculumIntoStudentContext,
} from "@/lib/onyx/curriculum-rag";
import type { OnyxSkillResponse } from "@/lib/onyx/skill-types";
import {
  isYoutubeLinkInText,
  ONYX_YOUTUBE_PROMPT_MAX_CHARS,
  prepareYoutubePromptForAi,
  shrinkYoutubeAiPrompt,
  YoutubeTranscriptUnavailableError,
} from "@/lib/onyx/youtube-transcript-server";

export type OnyxPostBody = {
  prompt?: string;
  messages?: unknown[];
  contextData?: unknown;
  mode?: "FAST" | "DEEP";
  isDeepMode?: boolean;
  hasImage?: boolean;
  deepSkillEngine?: boolean;
  academicSolution?: boolean;
  studentMode?: boolean;
  socraticTeacher?: boolean;
  socraticTurn?: number;
  studentId?: string;
  targetStudentId?: string;
  role?: OnyxRole;
  sessionId?: string;
  action?: OnyxEngineAction | OnyxActionType;
  /** Skill-Based Routing — welcome kartı / istemci yetenek seçimi */
  skillType?: OnyxSkillType;
  vision?: { base64: string; mimeType: string };
  continuation?: OnyxContinuationContext;
};

async function resolveRecentChatHistory(
  body: OnyxPostBody
): Promise<OnyxChatHistoryTurn[]> {
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    return pruneOnyxChatHistory(body.messages);
  }

  const sessionId = String(body.sessionId ?? "").trim();
  if (!sessionId) return [];

  const persisted = await listChatMessages(sessionId);
  return pruneOnyxChatHistory(
    persisted.map((m) => ({ role: m.role, content: m.content }))
  );
}

/**
 * Onyx AI — OnyxEngine + Kalıcı Bellek + Streaming (Vercel AI SDK)
 *
 * POST → streamText (SSE) veya vision reveal için JSON
 * GET `?sessionId=` · `?studentId=`
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireOnyxAuth();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId")?.trim();
    const studentId = searchParams.get("studentId")?.trim();

    if (sessionId) {
      const ownerId = await getChatSessionStudentId(sessionId);
      if (!ownerId) {
        return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 404 });
      }
      await assertOnyxStudentAccess(ctx, ownerId);
      const messages = await listChatMessages(sessionId);
      return NextResponse.json({ sessionId, messages });
    }

    if (studentId) {
      await assertOnyxStudentAccess(ctx, studentId);
      const sessions = await listStudentChatSessions(studentId, 30);
      return NextResponse.json({ studentId, sessions });
    }

    return NextResponse.json(
      { error: "sessionId veya studentId query gerekli" },
      { status: 400 }
    );
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireOnyxAuth();
    const rateLimited = await enforceRateLimit(
      request,
      "onyx",
      30,
      60,
      ctx.userId
    );
    if (rateLimited) return rateLimited;

    const body = (await request.json()) as OnyxPostBody;
    const prompt = String(body?.prompt ?? "").trim();
    const vision = body?.vision;
    const hasVision = Boolean(vision?.base64?.trim());
    const hasImage = body?.hasImage === true || hasVision;
    const isDeepMode =
      body?.isDeepMode === true || normalizeOnyxAiMode(body?.mode) === "DEEP";
    const chatHistory = await resolveRecentChatHistory(body);
    const groqModel = resolveOnyxGroqModelSafe({ hasImage, isDeepMode });
    const hasContinuation = Boolean(body?.continuation?.partialReply?.trim());

    if (!prompt && !hasVision && !hasContinuation) {
      return NextResponse.json(
        { error: "prompt, vision veya continuation gerekli", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const role = ctx.onyxRole;
    const isCoach = role === "coach";

    const targetStudentId = String(
      body?.targetStudentId ??
        body?.studentId ??
        (ctx.role === "student" ? ctx.userId : "")
    ).trim();

    if (targetStudentId) {
      await assertOnyxStudentAccess(ctx, targetStudentId);
    }

    let action = (body?.action ?? "general") as OnyxEngineAction;
    const careerExplicit = action === "kariyer-tercih";
    const strategyExplicit =
      action === "net-avcisi" ||
      action === "hedef-net-yol-haritasi" ||
      action === "acil-net-roketi" ||
      action === "gunun-gorevleri" ||
      action === "haftalik-program" ||
      action === "boss-savasi";
    const mentalExplicit =
      action === "kriz-modu" || action === "mental-check-in";
    const careerByIntent =
      !careerExplicit &&
      !strategyExplicit &&
      !mentalExplicit &&
      !hasVision &&
      !hasContinuation &&
      isCareerIntentText(prompt);
    const strategyByIntent =
      !careerExplicit &&
      !careerByIntent &&
      !strategyExplicit &&
      !mentalExplicit &&
      !hasVision &&
      !hasContinuation &&
      isStrategyIntentText(prompt);
    const mentalByIntent =
      !careerExplicit &&
      !careerByIntent &&
      !strategyExplicit &&
      !strategyByIntent &&
      !mentalExplicit &&
      !hasVision &&
      !hasContinuation &&
      isMentalIntentText(prompt);

    let skillType = resolveSkillType({
      skillType: body.skillType,
      action,
      prompt,
      hasVision,
      careerIntent: careerExplicit || careerByIntent,
      strategyIntent: strategyExplicit || strategyByIntent,
      mentalIntent: mentalExplicit || mentalByIntent,
    });

    let finalPrompt = prompt;

    if (isYoutubeLinkInText(prompt) || skillType === "youtube_assistant") {
      if (isYoutubeLinkInText(prompt)) {
        skillType = "youtube_assistant";
        action = skillTypeToAction("youtube_assistant") as OnyxEngineAction;
      }

      if (isYoutubeLinkInText(prompt)) {
        try {
          finalPrompt = shrinkYoutubeAiPrompt(
            await prepareYoutubePromptForAi(prompt),
            ONYX_YOUTUBE_PROMPT_MAX_CHARS
          );
        } catch (err) {
          if (err instanceof YoutubeTranscriptUnavailableError) {
            const onyxResponse: OnyxSkillResponse = {
              type: "chat",
              data: { text: err.message },
            };
            return NextResponse.json({
              reply: err.message,
              model: "",
              skillType: "youtube_assistant",
              onyxResponse,
              socraticPhase: "reveal",
              socraticTurn: 1,
              activeSkills: [],
            });
          }
          throw err;
        }
      }
    }

    if (body.skillType) {
      action = skillTypeToAction(skillType) as OnyxEngineAction;
    } else if (
      hasVision ||
      careerExplicit ||
      careerByIntent ||
      mentalExplicit ||
      mentalByIntent ||
      skillType === "youtube_assistant"
    ) {
      action = skillTypeToAction(skillType) as OnyxEngineAction;
    }

    const isQuestionSolveAction =
      action === "soru-fotografi" || action === "soru-metin";

    let studentData = body?.contextData;

    // Kariyer / strateji: Supabase son deneme + YÖK Atlas Strict RAG
    if (
      skillType === "career" ||
      skillType === "strategy" ||
      careerExplicit ||
      careerByIntent ||
      strategyExplicit ||
      strategyByIntent
    ) {
      if (targetStudentId) {
        const appwriteNets =
          await fetchLatestDenemeNetsFromAppwrite(targetStudentId);
        studentData = mergeSupabaseDenemeIntoContext(studentData, appwriteNets);
      }

      const rag = await buildCareerRagContext(prompt, studentData, {
        programLimit:
          skillType === "strategy" || strategyExplicit || strategyByIntent
            ? 8
            : 16,
      });
      studentData = mergeCareerIntoStudentContext(studentData, rag);
      if (skillType === "career" || careerExplicit || careerByIntent) {
        action = "kariyer-tercih";
      } else {
        action = "net-avcisi";
      }
    }

    const socraticTurn = Math.max(1, Number(body?.socraticTurn) || 1);
    const needsCurriculumRag =
      isSolveCurriculumAction(action) ||
      (hasVision && socraticTurn >= 2) ||
      (Boolean(body?.academicSolution) && isQuestionSolveAction);

    if (needsCurriculumRag && !careerExplicit && !careerByIntent) {
      const curriculumRag = buildCurriculumRagForSolve(prompt);
      studentData = mergeCurriculumIntoStudentContext(studentData, curriculumRag);
    }

    const engine = getOnyxEngine();
    const processInput = {
      input: finalPrompt,
      action,
      studentData,
      studentId: targetStudentId || undefined,
      sessionId: body?.sessionId,
      mode: normalizeOnyxAiMode(body?.mode),
      groqModel,
      hasImage,
      isDeepMode,
      chatHistory,
      socraticTurn: body?.socraticTurn,
      studentMode: !isCoach,
      academicSolution:
        Boolean(body?.academicSolution) || hasVision || isQuestionSolveAction,
      deepSkillEngine: body?.deepSkillEngine,
      socraticTeacher: body?.socraticTeacher,
      role,
      vision: hasVision
        ? {
            base64: String(vision!.base64),
            mimeType: String(vision!.mimeType || "image/jpeg"),
          }
        : undefined,
      continuation: body?.continuation,
      skillType,
    };

    const prep = engine.prepareStreamRequest(processInput);

    if (prep.kind === "blocking") {
      const result = await engine.processRequest(processInput);
      return NextResponse.json({
        reply: result.reply,
        model: result.model,
        sessionId: result.sessionId,
        socraticPhase: result.socraticPhase,
        socraticTurn: result.socraticTurn,
        activeSkills: result.activeSkills,
        finishReason: result.finishReason,
        finished: result.finished,
        truncated: result.truncated,
        usedFallback: result.usedFallback,
        careerCounseling: result.careerCounseling,
        onyxResponse: result.onyxResponse,
        skillType,
      });
    }

    try {
      const finalSystemPrompt = prependOnyxIntentRecognition(prep.system);

      return await runOnyxStreamResponse({
        ...prep,
        system: finalSystemPrompt,
        groqModel: prep.groqModel || groqModel,
        hasImage,
        isDeepMode,
      });
    } catch (streamErr) {
      console.error("Groq API Hatası:", streamErr);
      return onyxStreamErrorResponse(streamErr);
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof OnyxGroqError) {
      const status =
        err.code === "MISSING_API_KEY"
          ? 503
          : err.code === "RATE_LIMIT"
            ? 429
            : err.code === "BAD_REQUEST"
              ? 400
              : 500;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status }
      );
    }
    const detail = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json(
      { error: "Onyx isteği başarısız", detail, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
