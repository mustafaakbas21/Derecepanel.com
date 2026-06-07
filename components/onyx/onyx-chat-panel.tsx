"use client";

/**
 * Birleşik Onyx sohbet paneli — koç ve öğrenci aynı bileşeni kullanır (`role` prop).
 * Yeni özellikler burada veya `lib/onyx/*` + `lib/onyx-client.ts` içinde tek seferde eklenir.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Camera, X } from "lucide-react";
import {
  buildDeepAnalysisFinalPrompt,
  isDeepQueryAction,
  type OnyxDeepQueryAction,
  type OnyxQueryStep,
} from "@/lib/onyx/deep-query-wizard";
import {
  buildInteractiveAskFinalPrompt,
  getInteractiveAskInputPlaceholder,
  getInteractiveAskOnyxMessage,
  isInteractiveAskAction,
  type OnyxInteractiveAskAction,
} from "@/lib/onyx/interactive-ask-wizard";
import {
  buildKonuOzetFinalPrompt,
  konuOzetWizardTopicOnyxMessage,
  type OnyxSummaryStep,
} from "@/lib/onyx/konu-ozet-wizard";
import { buildStudentContextData } from "@/lib/onyx/build-student-context";
import { applyCurriculumMarkClient } from "@/lib/db/apply-curriculum-client";
import { readImageFileAsBase64, type OnyxImagePayload } from "@/lib/onyx/image-utils";
import { wantsImmediateQuestionSolve } from "@/lib/onyx/solve-intent";
import {
  filterCoachActiveStudents,
  studentDisplayName,
  studentSelectValue,
} from "@/lib/onyx/coach-students";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import {
  onyxOptionToStudentRecord,
  type OnyxStudentOption,
} from "@/lib/onyx/onyx-student-options";
import type { OnyxAiMode } from "@/lib/onyx/ai-mode";
import type { OnyxActionType } from "@/lib/onyx/types";
import { OnyxChatHistorySidebar } from "@/components/onyx/onyx-chat-history-sidebar";
import { OnyxMainToolbar } from "@/components/onyx/onyx-main-toolbar";
import {
  OnyxChatInputBox,
  type OnyxChatInputRef,
} from "@/components/onyx/onyx-chat-input-box";
import { OnyxLoadingStatusBar } from "@/components/onyx/onyx-loading-status-bar";
import { OnyxMessageList } from "@/components/onyx/onyx-message-list";
import { OnyxContextPanel } from "@/components/onyx/onyx-context-panel";
import {
  EmptyStateWelcome,
  type OnyxEmptyStateActionId,
} from "@/components/onyx/onyx-empty-state-guide";
import { mapPersistedMessagesToChat } from "@/components/onyx/map-persisted-messages";
import { ONYX_CONTINUE_USER_PROMPT } from "@/lib/onyx/continuity";
import {
  askOnyx,
  askOnyxVision,
  buildOnyxChatMessage,
  fetchOnyxChatSession,
  fetchOnyxChatSessions,
  loadLatestOnyxChat,
  onyxContinuityFromResponse,
  type ChatSessionSummary,
  OnyxClientError,
} from "@/lib/onyx-client";
import { useStudentKonuTakip } from "@/hooks/use-student-konu-takip";
import { useOnyxContinuity } from "@/hooks/use-onyx-continuity";
import { useStudentsFull } from "@/lib/students/use-students-full";
import { appToast } from "@/lib/notify";

function toastOnyxModelFallback(usedFallback?: boolean) {
  if (usedFallback) {
    appToast.info("Yoğunluktan dolayı yanıt Hızlı mod ile tamamlandı.");
  }
}
import { cn } from "@/lib/utils";

import {
  isCareerIntentText,
  type OnyxCareerCounseling,
} from "@/lib/onyx/career-counseling";
import type { OnyxDeepErrorDiagnosis } from "@/lib/onyx/deep-error-diagnosis";
import { actionToSkillType, isStructuredSkillType } from "@/lib/onyx/skill-router";
import { resolveVisionSolveSkillResponse } from "@/lib/onyx/skill-adapters";
import type { OnyxSkillResponse, OnyxSkillType } from "@/lib/onyx/skill-types";
import {
  getEmptyStateStarterPrompt,
  isOnyxFileUploadAction,
} from "@/lib/onyx/empty-state-actions";
import {
  ONYX_MODE_SELECTOR_PLACEHOLDER,
  type OnyxModeOption,
} from "@/lib/onyx/mode-selector";
import { OnyxSkillPicker } from "@/components/onyx/onyx-skill-picker";

export type OnyxChatMessage = {
  role: "user" | "onyx";
  content: string;
  /** Derin hata analizi kartı */
  deepErrorDiagnosis?: OnyxDeepErrorDiagnosis;
  /** Kariyer & tercih danışmanlığı kartı */
  careerCounseling?: OnyxCareerCounseling;
  /** Skill-Based Response UI zarfı */
  onyxResponse?: OnyxSkillResponse;
  /** Öğrenci vision — kullanıcı mesajı önizlemesi */
  imagePreview?: string;
  /** Konu Takip güncellendi rozeti */
  curriculumAdded?: boolean;
  curriculumTopicLabel?: string;
  /** Token sınırında kesildi — Continuity Engine */
  truncated?: boolean;
  /** Devam isteği gönderildi */
  continued?: boolean;
  /** SSE akışı devam ediyor */
  streaming?: boolean;
  /** Yapılandırılmış skill yanıtı bekleniyor (skeleton UI) */
  pendingSkillType?: OnyxSkillType;
};

export type OnyxPanelUser = {
  id?: string;
  name?: string;
  role?: OnyxRole;
  [key: string]: unknown;
};

export interface OnyxPanelProps {
  role: OnyxRole;
  currentUser: OnyxPanelUser;
  targetStudentId?: string;
  /** Koç — sunucu seed öğrenci listesi */
  initialStudents?: OnyxStudentOption[];
  className?: string;
}

export type OnyxChatPanelProps = OnyxPanelProps;

const MAIN_SCROLL_IDS = ["coach-main-scroll", "student-main-scroll"];

export function OnyxChatPanel({
  role,
  currentUser,
  targetStudentId: targetStudentIdProp,
  initialStudents = [],
  className,
}: OnyxPanelProps) {
  const isCoach = role === "coach";
  const isStudent = role === "student";

  const { studentId: sessionStudentId, hydrated: studentSessionReady, reload: reloadKonuTakip } =
    useStudentKonuTakip();

  const { students: allStudents, hydrated } = useStudentsFull({
    seedIfEmpty: true,
  });

  const coachStudents = useMemo(() => {
    const clientList = hydrated
      ? filterCoachActiveStudents(allStudents ?? [])
      : [];
    if (clientList.length > 0) return clientList;

    const fromServer = (initialStudents ?? [])
      .filter((s) => s?.status === "aktif")
      .map(onyxOptionToStudentRecord);
    return filterCoachActiveStudents(fromServer);
  }, [allStudents, hydrated, initialStudents]);

  const [messages, setMessages] = useState<OnyxChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    if (targetStudentIdProp) return targetStudentIdProp;
    if (isStudent) {
      return String(currentUser?.id ?? sessionStudentId ?? "").trim();
    }
    return "";
  });
  const [pendingImage, setPendingImage] = useState<OnyxImagePayload | null>(null);
  const [awaitingTextQuestion, setAwaitingTextQuestion] = useState(false);
  const [analyzingVision, setAnalyzingVision] = useState(false);
  const socraticTurnRef = useRef(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveStudentId = useMemo(() => {
    if (isStudent) {
      return (
        targetStudentIdProp?.trim() ||
        String(currentUser?.id ?? "").trim() ||
        sessionStudentId ||
        selectedStudentId
      );
    }
    return selectedStudentId;
  }, [
    isStudent,
    targetStudentIdProp,
    currentUser?.id,
    sessionStudentId,
    selectedStudentId,
  ]);

  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [summaryStep, setSummaryStep] = useState<OnyxSummaryStep>("IDLE");
  const [queryStep, setQueryStep] = useState<OnyxQueryStep>("IDLE");
  const [queryAction, setQueryAction] = useState<
    OnyxDeepQueryAction | OnyxInteractiveAskAction | null
  >(null);
  const [tempLesson, setTempLesson] = useState("");
  const [aiMode, setAiMode] = useState<OnyxAiMode>("FAST");
  const [continuingIndex, setContinuingIndex] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [composerModeLabel, setComposerModeLabel] = useState(
    ONYX_MODE_SELECTOR_PLACEHOLDER
  );

  const { continueIndex, findUserPromptBefore } = useOnyxContinuity(
    messages,
    isLoading
  );

  /** Son Onyx yanıtı tamamlandı mı? (`finish_reason === "stop"`) */
  const isFinished = useMemo(() => {
    if (isLoading) return true;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg?.role === "onyx") return !msg.truncated;
    }
    return true;
  }, [messages, isLoading]);

  const isQuerying = queryStep === "AWAITING_DETAILS";
  const showLoadingStatus = isLoading || analyzingVision;

  const chatInputRef = useRef<OnyxChatInputRef>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const run = () => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
      const chat = chatScrollRef.current;
      if (!chat) return;
      chat.scrollTo({
        top: chat.scrollHeight,
        behavior,
      });
    };
    run();
    requestAnimationFrame(run);
  }, []);

  useEffect(() => {
    if (!isStudent || !studentSessionReady || !effectiveStudentId) return;
    let cancelled = false;
    void (async () => {
      try {
        const [{ sessions }, latest] = await Promise.all([
          fetchOnyxChatSessions(effectiveStudentId),
          loadLatestOnyxChat(effectiveStudentId),
        ]);
        if (cancelled) return;
        setChatSessions(sessions);
        if (latest?.sessionId) setChatSessionId(latest.sessionId);
        if (latest?.messages?.length) {
          setMessages(mapPersistedMessagesToChat(latest.messages));
        }
      } catch {
        if (!cancelled) setChatSessions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isStudent, studentSessionReady, effectiveStudentId]);

  useEffect(() => {
    const main =
      MAIN_SCROLL_IDS.map((id) => document.getElementById(id)).find(Boolean) ??
      null;
    if (!main) return;
    const prevOverflow = main.style.overflow;
    const prevPaddingBottom = main.style.paddingBottom;
    const prevPaddingTop = main.style.paddingTop;
    main.style.overflow = "hidden";
    main.style.paddingBottom = "0";
    main.style.paddingTop = "0";
    main.classList.add("onyx-main-host");
    return () => {
      main.style.overflow = prevOverflow;
      main.style.paddingBottom = prevPaddingBottom;
      main.style.paddingTop = prevPaddingTop;
      main.classList.remove("onyx-main-host");
    };
  }, []);

  const resetWizard = useCallback(() => {
    setSummaryStep("IDLE");
    setQueryStep("IDLE");
    setQueryAction(null);
    setTempLesson("");
  }, []);

  const refreshChatSessions = useCallback(async () => {
    if (!effectiveStudentId) {
      setChatSessions([]);
      return;
    }
    setSessionsLoading(true);
    try {
      const { sessions } = await fetchOnyxChatSessions(effectiveStudentId);
      setChatSessions(sessions);
    } catch {
      setChatSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [effectiveStudentId]);

  const loadStudentChat = useCallback(
    async (studentId: string) => {
      setActiveSessionId(null);
      setChatSessionId(null);
      setMessages([]);
      setSessionsLoading(true);
      try {
        const { sessions } = await fetchOnyxChatSessions(studentId);
        setChatSessions(sessions);
      } catch {
        setChatSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    },
    []
  );

  const handleStudentChange = useCallback(
    (id: string) => {
      setSelectedStudentId(id);
      resetWizard();
      if (!id) {
        setChatSessionId(null);
        setActiveSessionId(null);
        setMessages([]);
        setChatSessions([]);
        return;
      }
      void loadStudentChat(id);
    },
    [loadStudentChat, resetWizard]
  );

  const initialStudentLoaded = useRef(false);
  useEffect(() => {
    if (!isCoach || initialStudentLoaded.current || !effectiveStudentId) return;
    initialStudentLoaded.current = true;
    void loadStudentChat(effectiveStudentId);
  }, [isCoach, effectiveStudentId, loadStudentChat]);

  const handleSelectSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setChatSessionId(sessionId);
    setSummaryStep("IDLE");
    setQueryStep("IDLE");
    setQueryAction(null);
    try {
      const data = await fetchOnyxChatSession(sessionId);
      setMessages(mapPersistedMessagesToChat(data.messages));
    } catch {
      appToast.error("Onyx", "Sohbet yüklenemedi.");
      setMessages([]);
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setChatSessionId(null);
    setMessages([]);
    setSummaryStep("IDLE");
    setQueryStep("IDLE");
    setQueryAction(null);
    setTempLesson("");
    setComposerModeLabel(ONYX_MODE_SELECTOR_PLACEHOLDER);
  }, []);

  const hasChat =
    messages.length > 0 ||
    isLoading ||
    summaryStep !== "IDLE" ||
    isQuerying;

  useEffect(() => {
    if (!hasChat) {
      setHistoryOpen(false);
      setContextOpen(false);
    }
  }, [hasChat]);

  const closeSidePanels = useCallback(() => {
    setHistoryOpen(false);
    setContextOpen(false);
  }, []);

  useLayoutEffect(() => {
    if (messages.length === 0 && !isLoading) return;
    scrollToBottom("auto");
    const t1 = window.setTimeout(() => scrollToBottom("smooth"), 50);
    const t2 = window.setTimeout(() => scrollToBottom("smooth"), 400);
    const t3 = window.setTimeout(() => scrollToBottom("smooth"), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    const list = messagesListRef.current;
    if (!list || (messages.length === 0 && !isLoading)) return;

    const ro = new ResizeObserver(() => {
      scrollToBottom("smooth");
    });
    ro.observe(list);
    return () => ro.disconnect();
  }, [messages.length, isLoading, scrollToBottom]);

  const selectedStudent = useMemo(
    () =>
      coachStudents.find((s) => studentSelectValue(s) === effectiveStudentId),
    [coachStudents, effectiveStudentId]
  );

  const resolveContext = useCallback(
    (actionType?: OnyxActionType) => {
      if (!effectiveStudentId) return undefined;
      return buildStudentContextData(effectiveStudentId, actionType);
    },
    [effectiveStudentId]
  );

  const onyxRequestMeta = useCallback(
    () => ({
      role,
      targetStudentId: effectiveStudentId,
      studentId: effectiveStudentId,
      studentMode: isStudent,
      sessionId: chatSessionId ?? undefined,
    }),
    [role, effectiveStudentId, isStudent, chatSessionId]
  );

  const appendOnyxReply = useCallback(
    async (
      promptText: string,
      context: unknown,
      mode: OnyxAiMode,
      deepSkillEngine?: boolean,
      actionType?: OnyxActionType,
      skillType?: OnyxSkillType
    ) => {
      const resolvedSkill =
        skillType ?? actionToSkillType(actionType);
      const isStructuredSkill = isStructuredSkillType(resolvedSkill);

      setMessages((prev) => [
        ...prev,
        {
          role: "onyx",
          content: isStructuredSkill ? "Onyx analiz hazırlanıyor…" : "",
          truncated: false,
          streaming: true,
          ...(isStructuredSkill && resolvedSkill
            ? { pendingSkillType: resolvedSkill }
            : {}),
        },
      ]);

      const result = await askOnyx(
        promptText,
        context,
        isStructuredSkill ? "DEEP" : mode,
        {
          deepSkillEngine,
          isDeepMode: isStructuredSkill || mode === "DEEP",
          hasImage: false,
          ...onyxRequestMeta(),
          action: actionType ?? "general",
          skillType: resolvedSkill,
          onTextDelta: isStructuredSkill
            ? undefined
            : (partialText) => {
                setMessages((prev) => {
                  const next = [...prev];
                  const idx = next.length - 1;
                  const last = next[idx];
                  if (last?.role !== "onyx") return prev;
                  next[idx] = { ...last, content: partialText, streaming: true };
                  return next;
                });
                window.requestAnimationFrame(() => scrollToBottom("smooth"));
              },
        }
      );

      if (result.sessionId) {
        setChatSessionId(result.sessionId);
        setActiveSessionId(result.sessionId);
        void refreshChatSessions();
      }

      toastOnyxModelFallback(result.usedFallback);

      setMessages((prev) => {
        const next = [...prev];
        const idx = next.length - 1;
        if (next[idx]?.role !== "onyx") return prev;
        next[idx] = {
          ...buildOnyxChatMessage(result.reply, result),
          ...(result.onyxResponse ? { onyxResponse: result.onyxResponse } : {}),
          ...(result.careerCounseling
            ? { careerCounseling: result.careerCounseling }
            : {}),
        };
        return next;
      });
      window.setTimeout(() => scrollToBottom("smooth"), 80);
    },
    [scrollToBottom, onyxRequestMeta, refreshChatSessions]
  );

  const handleContinueReply = useCallback(
    async (onyxIndex: number) => {
      if (isLoading || !effectiveStudentId) return;
      const onyxMsg = messages[onyxIndex];
      if (onyxMsg?.role !== "onyx" || !onyxMsg.truncated) return;

      const ctx = resolveContext();

      setContinuingIndex(onyxIndex);
      setIsLoading(true);
      try {
        const result = await askOnyx(
          ONYX_CONTINUE_USER_PROMPT,
          ctx,
          aiMode,
          {
            ...onyxRequestMeta(),
            isDeepMode: aiMode === "DEEP",
            hasImage: false,
            continuation: {
              partialReply: onyxMsg.content,
              originalUserPrompt: findUserPromptBefore(onyxIndex),
            },
            onTextDelta: (partialText) => {
              setMessages((prev) => {
                const next = [...prev];
                const existing = next[onyxIndex];
                if (existing?.role !== "onyx") return prev;
                next[onyxIndex] = {
                  ...existing,
                  content: `${onyxMsg.content}\n\n${partialText}`,
                  streaming: true,
                };
                return next;
              });
              window.requestAnimationFrame(() => scrollToBottom("smooth"));
            },
          }
        );
        if (result.sessionId) {
          setChatSessionId(result.sessionId);
          setActiveSessionId(result.sessionId);
          void refreshChatSessions();
        }
        toastOnyxModelFallback(result.usedFallback);
        const continuity = onyxContinuityFromResponse(result);
        setMessages((prev) => {
          const next = [...prev];
          const existing = next[onyxIndex];
          if (existing?.role !== "onyx") return prev;
          next[onyxIndex] = {
            ...existing,
            content: `${existing.content}\n\n${result.reply}`,
            truncated: continuity.truncated,
            continued: continuity.finished,
          };
          return next;
        });
        window.setTimeout(() => scrollToBottom("smooth"), 80);
      } catch (err) {
        const message =
          err instanceof OnyxClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Beklenmeyen hata";
        appToast.error("Onyx", message);
      } finally {
        setContinuingIndex(null);
        setIsLoading(false);
      }
    },
    [
      aiMode,
      findUserPromptBefore,
      isLoading,
      messages,
      onyxRequestMeta,
      refreshChatSessions,
      resolveContext,
      scrollToBottom,
      effectiveStudentId,
    ]
  );

  const runVisionOrText = useCallback(
    async (text: string, image: OnyxImagePayload | null) => {
      if (!effectiveStudentId) {
        appToast.warning("Onyx", "Öğrenci oturumu bulunamadı.");
        return false;
      }

      setIsLoading(true);
      setAnalyzingVision(Boolean(image));
      try {
        const useVisionProtocol = Boolean(image) || awaitingTextQuestion;
        if (useVisionProtocol) {
          const turn = socraticTurnRef.current;
          const promptText =
            text ||
            (image ? "Bu soru fotoğrafını çöz." : "Bu soruyu çöz.");
          const effectiveTurn = wantsImmediateQuestionSolve(promptText)
            ? 2
            : turn;
          const result = await askOnyxVision(
            effectiveStudentId,
            promptText,
            {
              vision: image
                ? { base64: image.base64, mimeType: image.mimeType }
                : undefined,
              socraticTurn: effectiveTurn,
              sessionId: chatSessionId ?? undefined,
              role,
            }
          );

          if (result.sessionId) setChatSessionId(result.sessionId);

          if (result.socraticPhase === "probe") {
            socraticTurnRef.current = 2;
            setMessages((prev) => [
              ...prev,
              buildOnyxChatMessage(result.reply, result),
            ]);
          } else {
            const diagnosis =
              result.deepDiagnosis ?? result.structured?.deepDiagnosis;
            const visionResponse = resolveVisionSolveSkillResponse({
              deepErrorDiagnosis: diagnosis,
              structured: result.structured,
              reply: result.reply,
              role,
            });

            if (result.structured && result.curriculum) {
              socraticTurnRef.current = 1;
              const mark = applyCurriculumMarkClient(effectiveStudentId, {
                solve: {
                  id: result.solveId ?? "",
                  studentId: effectiveStudentId,
                  cozum: result.structured.cozum,
                  konuBasligi: result.structured.konu_basligi,
                  zorlukSeviyesi: result.structured.zorluk_seviyesi,
                  hataKodu: result.structured.hata_kodu,
                  curriculumMarked: result.curriculum.applied,
                  createdAt: new Date().toISOString(),
                  model: result.model,
                  source: image ? "vision" : "text",
                  subjectId: result.curriculum.subjectId,
                  topicId: result.curriculum.topicId,
                  subjectName: result.curriculum.subjectName,
                  topicName: result.curriculum.topicName,
                },
                curriculum: result.curriculum,
              });
              if (mark.applied) reloadKonuTakip();
              const topicLabel = mark.topicName
                ? `${mark.subjectName ?? ""} → ${mark.topicName}`.replace(/^ → /, "")
                : result.structured.konu_basligi;
              setMessages((prev) => [
                ...prev,
                {
                  ...buildOnyxChatMessage(result.reply, result),
                  deepErrorDiagnosis: diagnosis,
                  onyxResponse: visionResponse ?? undefined,
                  curriculumAdded: mark.applied,
                  curriculumTopicLabel: mark.applied ? topicLabel : undefined,
                },
              ]);
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  ...buildOnyxChatMessage(result.reply, result),
                  deepErrorDiagnosis: diagnosis,
                  onyxResponse: visionResponse ?? undefined,
                },
              ]);
            }
          }
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "onyx", content: "", truncated: false, streaming: true },
          ]);

          const result = await askOnyx(text, undefined, aiMode, {
            ...onyxRequestMeta(),
            isDeepMode: aiMode === "DEEP",
            hasImage: false,
            socraticTurn: socraticTurnRef.current,
            action: "general",
            onTextDelta: (partialText) => {
              setMessages((prev) => {
                const next = [...prev];
                const idx = next.length - 1;
                const last = next[idx];
                if (last?.role !== "onyx") return prev;
                next[idx] = { ...last, content: partialText, streaming: true };
                return next;
              });
              window.requestAnimationFrame(() => scrollToBottom("smooth"));
            },
          });
          if (result.sessionId) setChatSessionId(result.sessionId);
          toastOnyxModelFallback(result.usedFallback);
          socraticTurnRef.current =
            result.socraticPhase === "probe" ? 2 : 1;
          setMessages((prev) => {
            const next = [...prev];
            const idx = next.length - 1;
            if (next[idx]?.role !== "onyx") return prev;
            next[idx] = buildOnyxChatMessage(result.reply, result);
            return next;
          });
        }
        window.setTimeout(() => scrollToBottom("smooth"), 80);
        return true;
      } catch (err) {
        const message =
          err instanceof OnyxClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Beklenmeyen hata";
        appToast.error("Onyx", message);
        setMessages((prev) => [
          ...prev,
          { role: "onyx", content: `Üzgünüm, yanıt üretemedim: ${message}` },
        ]);
        return false;
      } finally {
        setIsLoading(false);
        setAnalyzingVision(false);
        setPendingImage(null);
        setAwaitingTextQuestion(false);
      }
    },
    [
      awaitingTextQuestion,
      chatSessionId,
      effectiveStudentId,
      onyxRequestMeta,
      reloadKonuTakip,
      scrollToBottom,
    ]
  );

  const runWithContext = useCallback(
    async (
      promptText: string,
      mode: OnyxAiMode,
      actionType?: OnyxActionType,
      deepSkillEngine?: boolean,
      skillType?: OnyxSkillType
    ) => {
      if (actionType === "soru-fotografi" || actionType === "soru-metin") {
        return runVisionOrText(promptText, pendingImage);
      }

      const ctx = resolveContext(actionType);
      if (isCoach && !ctx) {
        appToast.warning(
          "Onyx",
          "Öğrenci seçin veya bu öğrenci için deneme sonucu yükleyin."
        );
        return false;
      }

      await appendOnyxReply(
        promptText,
        ctx,
        mode,
        deepSkillEngine,
        actionType,
        skillType
      );
      return true;
    },
    [isCoach, resolveContext, appendOnyxReply, runVisionOrText, pendingImage]
  );

  const runOnyxWithErrorHandling = useCallback(
    async (
      promptText: string,
      actionType?: OnyxActionType,
      requestMode?: OnyxAiMode,
      deepSkillEngine?: boolean,
      skillType?: OnyxSkillType
    ) => {
      const mode = requestMode ?? aiMode;
      setIsLoading(true);
      try {
        const ok = await runWithContext(
          promptText,
          mode,
          actionType,
          deepSkillEngine,
          skillType
        );
        if (!ok) setMessages((prev) => prev.slice(0, -1));
      } catch (err) {
        const message =
          err instanceof OnyxClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Beklenmeyen hata";
        appToast.error("Onyx", message);
        setMessages((prev) => [
          ...prev,
          {
            role: "onyx",
            content: `Üzgünüm, şu an yanıt üretemedim: ${message}`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [runWithContext, aiMode]
  );

  const handleImageFile = useCallback(async (file: File) => {
    try {
      const payload = await readImageFileAsBase64(file);
      socraticTurnRef.current = 1;
      setPendingImage(payload);
      appToast.success("Onyx", "Soru fotoğrafı eklendi. Gönder ile analiz et.");
    } catch (err) {
      appToast.error(
        "Onyx",
        err instanceof Error ? err.message : "Görsel yüklenemedi."
      );
    }
  }, []);

  const handleContinueAt = useCallback(
    (index: number) => {
      void handleContinueReply(index);
    },
    [handleContinueReply]
  );

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Onyx AI",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      appToast.success("Onyx", "Bağlantı panoya kopyalandı.");
    } catch {
      appToast.info("Onyx", "Paylaşım iptal edildi.");
    }
  }, []);

  const fillInputFromWelcomeCard = useCallback(
    (action: OnyxEmptyStateActionId) => {
      const draft = getEmptyStateStarterPrompt(action, role);
      if (draft) {
        chatInputRef.current?.setDraft(draft);
      } else {
        chatInputRef.current?.focus();
      }
      requestAnimationFrame(() => {
        chatInputRef.current?.focus();
      });
    },
    [role]
  );

  const handleEmptyStateAction = useCallback(
    (action: OnyxEmptyStateActionId) => {
      if (isLoading) return;

      if (!effectiveStudentId) {
        appToast.warning(
          "Onyx",
          isCoach ? "Lütfen önce bir öğrenci seçin." : "Oturum hazırlanıyor…"
        );
        return;
      }

      if (isOnyxFileUploadAction(action)) {
        fileInputRef.current?.click();
        return;
      }

      fillInputFromWelcomeCard(action);
    },
    [isLoading, effectiveStudentId, isCoach, fillInputFromWelcomeCard]
  );

  const handleComposerModeSelect = useCallback(
    (mode: OnyxModeOption) => {
      if (isLoading) return;

      if (!effectiveStudentId) {
        appToast.warning(
          "Onyx",
          isCoach ? "Lütfen önce bir öğrenci seçin." : "Oturum hazırlanıyor…"
        );
        return;
      }

      setComposerModeLabel(mode.label);

      if (mode.behavior === "interactive-ask") {
        const action = mode.actionId;
        if (isInteractiveAskAction(action)) {
          setQueryAction(action);
          setQueryStep("AWAITING_DETAILS");
          setMessages((prev) => [
            ...prev,
            { role: "onyx", content: getInteractiveAskOnyxMessage(action) },
          ]);
          chatInputRef.current?.focus();
          return;
        }
      }

      if (mode.behavior === "instant") {
        setAiMode("DEEP");
        setMessages((prev) => [...prev, { role: "user", content: mode.label }]);
        void runOnyxWithErrorHandling(mode.promptText, mode.actionId, "DEEP");
        return;
      }

      chatInputRef.current?.setDraft(mode.promptText);
      chatInputRef.current?.focus();
    },
    [
      isLoading,
      effectiveStudentId,
      isCoach,
      runOnyxWithErrorHandling,
    ]
  );

  const handleComposerSkillChip = useCallback(
    (action: OnyxEmptyStateActionId) => {
      handleEmptyStateAction(action);
    },
    [handleEmptyStateAction]
  );

  const handleSubmitText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (isLoading) return;
      if (!text && !pendingImage) return;

      if (!effectiveStudentId) {
        appToast.warning(
          "Onyx",
          isCoach ? "Lütfen önce bir öğrenci seçin." : "Oturum hazırlanıyor…"
        );
        return;
      }

      if (pendingImage || awaitingTextQuestion) {
        const image = pendingImage;
        const userContent = text || (image ? "📷 Soru fotoğrafı" : "");
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            content: userContent,
            ...(image ? { imagePreview: image.dataUrl } : {}),
          },
        ]);
        chatInputRef.current?.clear();
        await runVisionOrText(text, image);
        return;
      }

      setMessages((prev) => [...prev, { role: "user", content: text }]);
      chatInputRef.current?.clear();

      if (summaryStep === "AWAITING_LESSON") {
        setTempLesson(text);
        setSummaryStep("AWAITING_TOPIC");
        setMessages((prev) => [
          ...prev,
          { role: "onyx", content: konuOzetWizardTopicOnyxMessage(text) },
        ]);
        return;
      }

      if (summaryStep === "AWAITING_TOPIC") {
        const lesson = tempLesson;
        setSummaryStep("IDLE");
        const finalPrompt = buildKonuOzetFinalPrompt(lesson, text);
        setAiMode("DEEP");
        await runOnyxWithErrorHandling(finalPrompt, "konu-ozet", "DEEP");
        return;
      }

      if (queryStep === "AWAITING_DETAILS" && queryAction) {
        const action = queryAction;
        setQueryStep("IDLE");
        setQueryAction(null);

        if (isDeepQueryAction(action)) {
          const finalPrompt = buildDeepAnalysisFinalPrompt(action, text);
          setAiMode("DEEP");
          await runOnyxWithErrorHandling(finalPrompt, action, "DEEP", true);
          return;
        }

        if (isInteractiveAskAction(action)) {
          const finalPrompt = buildInteractiveAskFinalPrompt(action, text);
          setAiMode("DEEP");
          await runOnyxWithErrorHandling(finalPrompt, action, "DEEP");
          return;
        }
      }

      if (isCareerIntentText(text)) {
        await runOnyxWithErrorHandling(
          text,
          "kariyer-tercih",
          "DEEP",
          undefined,
          "career"
        );
        return;
      }

      if (/youtube\.com|youtu\.be/i.test(text)) {
        await runOnyxWithErrorHandling(
          text,
          "feynman-modu",
          "DEEP",
          undefined,
          "youtube_assistant"
        );
        return;
      }

      await runOnyxWithErrorHandling(text, undefined, aiMode);
    },
    [
      isLoading,
      isCoach,
      effectiveStudentId,
      pendingImage,
      awaitingTextQuestion,
      summaryStep,
      queryStep,
      queryAction,
      tempLesson,
      aiMode,
      runOnyxWithErrorHandling,
      runVisionOrText,
    ]
  );

  const studentsReady = hydrated || (coachStudents?.length ?? 0) > 0;
  const selectDisabled = isLoading || !studentsReady;

  const inputPlaceholder = pendingImage
    ? "İsteğe bağlı not ekle…"
    : awaitingTextQuestion
      ? "Sorunu buraya yaz veya yapıştır…"
      : isQuerying
        ? queryAction && isInteractiveAskAction(queryAction)
          ? getInteractiveAskInputPlaceholder(queryAction)
          : "Zorlandığın dersler, haftalık çalışma saatin ve hedefini tek mesajda yaz…"
        : summaryStep === "AWAITING_LESSON"
          ? "Örn: Matematik, Fizik, Kimya…"
          : summaryStep === "AWAITING_TOPIC"
            ? "Örn: TYT Fonksiyonlar, AYT Limit…"
            : effectiveStudentId
              ? hasChat
                ? isCoach
                  ? "Ne sormak istersin? Onyx niyetini anlayıp yanıtlar…"
                  : "Sorunu yaz veya fotoğraf yükle…"
                : "Mesajını buraya yaz…"
              : isCoach
                ? "Sağ panelden bir öğrenci seçin"
                : "Oturum hazırlanıyor…";

  const canAttachPhoto = Boolean(effectiveStudentId);

  const sidePanelOpen = historyOpen || contextOpen;

  return (
    <div
      className={cn(
        "onyx-saas-layout relative flex h-full min-h-0 w-full overflow-hidden",
        !hasChat && "onyx-saas-layout--immersive",
        className
      )}
      data-layout="onyx-canvas"
    >
      {sidePanelOpen ? (
        <button
          type="button"
          className="onyx-sidebar-backdrop onyx-sidebar-backdrop--visible"
          aria-label="Panelleri kapat"
          onClick={closeSidePanels}
        />
      ) : null}

      <OnyxChatHistorySidebar
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        students={isCoach ? coachStudents ?? [] : []}
        studentsReady={isCoach ? studentsReady : studentSessionReady}
        selectedStudentId={effectiveStudentId}
        onStudentChange={handleStudentChange}
        selectDisabled={selectDisabled}
        showStudentSelect={false}
        sessions={chatSessions}
        sessionsLoading={sessionsLoading}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => void handleSelectSession(id)}
        onNewChat={handleNewChat}
      />

      <main className="onyx-main-canvas relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <OnyxMainToolbar
          onNewChat={handleNewChat}
          onToggleHistory={() => setHistoryOpen((v) => !v)}
          onToggleContext={() => setContextOpen((v) => !v)}
          onShare={() => void handleShare()}
          historyOpen={historyOpen}
          contextOpen={contextOpen}
          showContextToggle
          newChatDisabled={!effectiveStudentId || isLoading}
          showStudentSelect={isCoach}
          students={coachStudents ?? []}
          studentsReady={studentsReady}
          selectedStudentId={effectiveStudentId}
          onStudentChange={handleStudentChange}
          selectDisabled={selectDisabled}
        />

        <div className="onyx-chat-stage relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={chatScrollRef}
            className={cn(
              "custom-scrollbar onyx-chat-scroll min-h-0 flex-1 overscroll-contain",
              hasChat
                ? "overflow-y-auto p-4 sm:px-6"
                : "overflow-y-auto p-4 pb-3 sm:px-6 sm:pt-6"
            )}
            aria-live="polite"
            aria-label={hasChat ? "Onyx sohbet geçmişi" : "Onyx karşılama"}
          >
            <div
              ref={messagesListRef}
              className={cn(
                "mx-auto w-full max-w-3xl",
                hasChat
                  ? "flex flex-col gap-6 pb-2"
                  : "flex min-h-full flex-col items-center justify-center py-6 text-center sm:py-10"
              )}
            >
              {!hasChat ? (
                <EmptyStateWelcome
                  role={role}
                  disabled={isLoading || !effectiveStudentId}
                  onAction={handleEmptyStateAction}
                />
              ) : (
                <OnyxMessageList
                  messages={messages}
                  isCoach={isCoach}
                  studentId={effectiveStudentId}
                  continueIndex={continueIndex}
                  continuingIndex={continuingIndex}
                  isFinished={isFinished}
                  onContinueAt={handleContinueAt}
                  messagesEndRef={messagesEndRef}
                />
              )}
            </div>
          </div>

          <div
            className={cn(
              "onyx-chat-composer z-20 shrink-0 overflow-visible px-4 py-3 sm:px-8 sm:py-4",
              !hasChat
                ? "onyx-chat-composer--welcome"
                : "border-t border-slate-200/70 bg-white/80 backdrop-blur-sm"
            )}
          >
            <div
              className={cn(
                "onyx-composer-dock",
                !hasChat && "onyx-composer-dock--float"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImageFile(file);
                  e.target.value = "";
                }}
              />

              <div className="onyx-composer-dock w-full max-w-3xl mx-auto">
                {pendingImage ? (
                  <div className="relative mb-2 inline-flex w-fit rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pendingImage.dataUrl}
                      alt="Seçilen soru"
                      className="max-h-24 rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setPendingImage(null)}
                      className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-white shadow"
                      aria-label="Fotoğrafı kaldır"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}

                {showLoadingStatus ? (
                  <OnyxLoadingStatusBar analyzingVision={analyzingVision} />
                ) : null}

                <OnyxChatInputBox
                  ref={chatInputRef}
                  variant={hasChat ? "pill" : "float"}
                  onSubmit={(text) => void handleSubmitText(text)}
                  placeholder={inputPlaceholder}
                  disabled={isLoading || !effectiveStudentId}
                  hasPendingImage={Boolean(pendingImage)}
                  isLoading={isLoading}
                  isQuerying={isQuerying}
                  inputHighlighted={
                    Boolean(pendingImage) || awaitingTextQuestion
                  }
                  leadingSlot={
                    <OnyxSkillPicker
                      role={role}
                      selectedModeLabel={composerModeLabel}
                      onSelectMode={handleComposerModeSelect}
                      onSelectSkill={handleComposerSkillChip}
                      disabled={!effectiveStudentId}
                      isLoading={isLoading}
                    />
                  }
                  onAttachFile={
                    canAttachPhoto
                      ? () => fileInputRef.current?.click()
                      : undefined
                  }
                  attachLabel="Fotoğraf veya dosya ekle"
                  attachIcon={<Camera size={18} aria-hidden />}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {isCoach ? (
        <OnyxContextPanel
          role="coach"
          open={contextOpen}
          onClose={() => setContextOpen(false)}
          targetStudentId={effectiveStudentId || null}
          students={coachStudents ?? []}
          studentsReady={studentsReady}
          onStudentChange={handleStudentChange}
        />
      ) : (
        <OnyxContextPanel
          role="student"
          open={contextOpen}
          onClose={() => setContextOpen(false)}
          targetStudentId={effectiveStudentId || null}
          currentUserName={String(currentUser?.name ?? "")}
        />
      )}
    </div>
  );
}
