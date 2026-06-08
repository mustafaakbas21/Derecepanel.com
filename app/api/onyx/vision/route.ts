import { NextResponse } from "next/server";

import {
  getCoachDeepErrorAlerts,
  getWeakTopicsFromSolves,
  listOnyxSolvesByStudent,
  saveQuestionToCurriculum,
} from "@/lib/db/actions";
import { persistChatExchange } from "@/lib/db/chat-memory";
import type { OnyxChatMessageMetadata } from "@/lib/onyx/chat-message-metadata";
import { listQuestionMemoryByStudent } from "@/lib/db/question-memory";
import { buildCurriculumRagForSolve, buildCurriculumRagForVisionSolve } from "@/lib/onyx/curriculum-rag";
import { completeSolveVision } from "@/lib/onyx/complete-solve-vision";
import { resolveVisionSolveSkillResponse } from "@/lib/onyx/skill-adapters";
import { detectOnyxReplyContinuity } from "@/lib/onyx/continuity";
import { completeOnyxWithGroq, OnyxGroqError } from "@/lib/onyx/groq-server";
import { AuthError } from "@/lib/auth/require-coach";
import {
  assertOnyxStudentAccess,
  requireOnyxAuth,
} from "@/lib/auth/require-onyx";
import { enforceRateLimit } from "@/lib/security/apply-rate-limit";
import { wantsImmediateQuestionSolve } from "@/lib/onyx/solve-intent";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";

export type OnyxVisionPostBody = {
  studentId: string;
  prompt?: string;
  contextData?: unknown;
  vision?: { base64: string; mimeType: string };
  /** 1 = Sokratik · 2+ = tam çözüm + hafıza */
  socraticTurn?: number;
  sessionId?: string;
  role?: OnyxRole;
};

async function saveVisionTurn(
  studentId: string,
  sessionId: string | undefined,
  userContent: string,
  onyxContent: string,
  vision?: { base64: string; mimeType: string },
  onyxMetadata?: OnyxChatMessageMetadata
) {
  return persistChatExchange({
    studentId,
    sessionId,
    userContent,
    onyxContent,
    userImage: vision?.base64?.trim()
      ? {
          base64: vision.base64,
          mimeType: vision.mimeType,
        }
      : undefined,
    onyxMetadata,
  });
}

function imageDataUrl(
  vision?: { base64: string; mimeType: string }
): string | null {
  if (!vision?.base64?.trim()) return null;
  const mime = vision.mimeType || "image/jpeg";
  return `data:${mime};base64,${vision.base64}`;
}

/** Soru çözme & müfredat — vision / metin */
export async function POST(request: Request) {
  try {
    const ctx = await requireOnyxAuth();
    const rateLimited = await enforceRateLimit(
      request,
      "onyx-vision",
      30,
      60,
      ctx.userId
    );
    if (rateLimited) return rateLimited;

    const body = (await request.json()) as OnyxVisionPostBody;
    const studentId = String(
      body?.studentId ?? (ctx.role === "student" ? ctx.userId : "")
    ).trim();
    if (!studentId) {
      return NextResponse.json(
        { error: "studentId gerekli", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    await assertOnyxStudentAccess(ctx, studentId);
    const role = ctx.onyxRole;

    const prompt = String(body?.prompt ?? "").trim();
    const vision = body?.vision;
    const hasVision = Boolean(vision?.base64?.trim());
    if (!prompt && !hasVision) {
      return NextResponse.json(
        { error: "prompt veya vision gerekli", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const immediateSolve = wantsImmediateQuestionSolve(prompt);
    const socraticTurn = immediateSolve
      ? 2
      : Math.max(1, Number(body?.socraticTurn) || 1);

    if (socraticTurn < 2) {
      const probe = await completeOnyxWithGroq({
        prompt:
          prompt ||
          (hasVision
            ? "Öğrenci bu soru fotoğrafını paylaştı. Sokratik protokole uy."
            : "Öğrenci bu yazılı soruyu paylaştı. Sokratik protokole uy."),
        contextData: body?.contextData,
        mode: "DEEP",
        studentMode: true,
        academicSolution: true,
        socraticTeacher: true,
        socraticTurn: 1,
        vision: hasVision
          ? {
              base64: String(vision!.base64),
              mimeType: String(vision!.mimeType || "image/jpeg"),
            }
          : undefined,
      });

      const userLabel = hasVision
        ? prompt || "📷 Soru fotoğrafı"
        : prompt;
      const chat = await saveVisionTurn(
        studentId,
        body.sessionId,
        userLabel,
        probe.reply,
        hasVision ? vision : undefined
      );

      const continuity = detectOnyxReplyContinuity(probe.finishReason);
      return NextResponse.json({
        reply: probe.reply,
        model: probe.model,
        socraticPhase: "probe" as const,
        socraticTurn: 1,
        sessionId: chat.sessionId,
        finishReason: continuity.finishReason,
        finished: continuity.finished,
        truncated: continuity.truncated,
      });
    }

    const curriculumRag = hasVision
      ? buildCurriculumRagForVisionSolve()
      : buildCurriculumRagForSolve(
          prompt || (hasVision ? "soru fotoğrafı analizi" : "")
        );

    const solved = await completeSolveVision({
      prompt: prompt || (hasVision ? "" : prompt),
      vision: hasVision
        ? {
            base64: String(vision!.base64),
            mimeType: String(vision!.mimeType || "image/jpeg"),
          }
        : undefined,
      role,
      curriculumRag,
    });

    const saved = await saveQuestionToCurriculum({
      studentId,
      structured: solved.structured,
      model: solved.model,
      source: hasVision ? "vision" : "text",
      questionImage: imageDataUrl(vision),
    });

    const userLabel = hasVision
      ? prompt || "📷 Soru fotoğrafı"
      : prompt;
    const visionOnyxResponse = resolveVisionSolveSkillResponse({
      deepErrorDiagnosis: solved.structured.deepDiagnosis,
      structured: solved.structured,
      reply: solved.reply,
      role,
    });
    const onyxMetadata: OnyxChatMessageMetadata | undefined = visionOnyxResponse
      ? {
          onyxResponse: visionOnyxResponse,
          ...(solved.structured.deepDiagnosis
            ? { deepErrorDiagnosis: solved.structured.deepDiagnosis }
            : {}),
        }
      : solved.structured.deepDiagnosis
        ? { deepErrorDiagnosis: solved.structured.deepDiagnosis }
        : undefined;
    const chat = await saveVisionTurn(
      studentId,
      body.sessionId,
      userLabel,
      solved.reply,
      hasVision ? vision : undefined,
      onyxMetadata
    );

    return NextResponse.json({
      reply: solved.reply,
      model: solved.model,
      structured: solved.structured,
      deepDiagnosis: solved.structured.deepDiagnosis,
      onyxResponse: visionOnyxResponse ?? undefined,
      curriculum: saved.curriculum,
      solveId: saved.solve.id,
      socraticPhase: "reveal" as const,
      socraticTurn,
      sessionId: chat.sessionId,
    });
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
    console.error("[Onyx Vision]", detail, err);
    return NextResponse.json(
      { error: "Vision isteği başarısız", detail, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/** Koç — soru geçmişi + zorlanılan sorular (QuestionMemory) */
export async function GET(request: Request) {
  try {
    const ctx = await requireOnyxAuth();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId")?.trim();
    const studentName =
      searchParams.get("studentName")?.trim() || "Öğrenci";
    if (!studentId) {
      return NextResponse.json(
        { error: "studentId query parametresi gerekli" },
        { status: 400 }
      );
    }

    await assertOnyxStudentAccess(ctx, studentId);

    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [solves, weakTopics, struggled, deepErrorAlerts] = await Promise.all([
      listOnyxSolvesByStudent(studentId, 30),
      getWeakTopicsFromSolves(studentId, 8),
      listQuestionMemoryByStudent(studentId, { since: since7, limit: 30 }),
      getCoachDeepErrorAlerts(studentId, studentName, 7),
    ]);

    return NextResponse.json({
      solves,
      weakTopics,
      struggledQuestions: struggled,
      deepErrorAlerts,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
