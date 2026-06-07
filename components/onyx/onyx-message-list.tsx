"use client";

import { memo, useCallback, useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";

import { OnyxChatImagePreview } from "@/components/onyx/onyx-chat-image-preview";
import { OnyxResponseRenderer } from "@/components/onyx/onyx-response-renderer";
import { OnyxCurriculumBadge } from "@/components/onyx/onyx-curriculum-badge";
import type { OnyxCareerCounseling } from "@/lib/onyx/career-counseling";
import type { OnyxDeepErrorDiagnosis } from "@/lib/onyx/deep-error-diagnosis";
import type { OnyxSkillResponse } from "@/lib/onyx/skill-types";
import { appToast } from "@/lib/notify";
import { cn } from "@/lib/utils";

export type OnyxMessageListItem = {
  role: "user" | "onyx";
  content: string;
  onyxResponse?: OnyxSkillResponse;
  deepErrorDiagnosis?: OnyxDeepErrorDiagnosis;
  careerCounseling?: OnyxCareerCounseling;
  imagePreview?: string;
  curriculumAdded?: boolean;
  curriculumTopicLabel?: string;
  truncated?: boolean;
  streaming?: boolean;
};

const OnyxCopyButton = memo(function OnyxCopyButton({
  content,
}: {
  content: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      appToast.error("Onyx", "Metin panoya kopyalanamadı.");
    }
  }, [content]);

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={cn(
        "absolute top-4 right-4 z-10 cursor-pointer rounded-lg bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800",
        copied && "text-emerald-600 hover:text-emerald-700"
      )}
      aria-label={copied ? "Kopyalandı" : "Panoya kopyala"}
      title={copied ? "Kopyalandı" : "Panoya kopyala"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
});

const OnyxUserMessageRow = memo(function OnyxUserMessageRow({
  message,
}: {
  message: OnyxMessageListItem;
}) {
  return (
    <div className="flex w-full justify-end duration-500 ease-out animate-in fade-in slide-in-from-bottom-4">
      <div className="max-w-[80%] space-y-2">
        {message.imagePreview ? (
          <OnyxChatImagePreview
            src={message.imagePreview}
            alt="Yüklenen soru"
            className="ml-auto max-w-full sm:max-w-md"
          />
        ) : null}
        <div className="rounded-2xl rounded-tr-sm bg-slate-900 px-5 py-3 text-sm text-white shadow-md md:text-base">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  );
});

type OnyxAssistantMessageRowProps = {
  message: OnyxMessageListItem;
  index: number;
  isCoach: boolean;
  studentId?: string;
  showContinue: boolean;
  continueLoading: boolean;
  showCopy: boolean;
  onContinueAt: (index: number) => void;
};

const OnyxAssistantMessageRow = memo(function OnyxAssistantMessageRow({
  message,
  index,
  isCoach,
  studentId,
  showContinue,
  continueLoading,
  showCopy,
  onContinueAt,
}: OnyxAssistantMessageRowProps) {
  const handleContinue = useCallback(() => {
    onContinueAt(index);
  }, [index, onContinueAt]);

  const useSkillShell =
    !message.streaming &&
    ((message.onyxResponse?.type != null &&
      message.onyxResponse.type !== "chat") ||
      Boolean(message.careerCounseling || message.deepErrorDiagnosis));

  return (
    <div className="flex w-full justify-start gap-4 duration-700 ease-out animate-in fade-in slide-in-from-bottom-4">
      <div
        className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-md"
        aria-hidden
      >
        <Sparkles className="h-4 w-4 text-amber-300" />
      </div>

      <div
        className={cn(
          "min-w-0 flex-1",
          useSkillShell ? "max-w-[min(100%,48rem)]" : "max-w-[min(100%,42rem)]"
        )}
      >
        {useSkillShell ? (
          <OnyxResponseRenderer
            message={message}
            role={isCoach ? "coach" : "student"}
            studentId={studentId}
          />
        ) : (
          <OnyxResponseRenderer
            message={message}
            role={isCoach ? "coach" : "student"}
            studentId={studentId}
            showContinue={showContinue}
            continueLoading={continueLoading}
            onContinue={handleContinue}
            headerSlot={
              showCopy && !message.streaming ? (
                <OnyxCopyButton content={message.content} />
              ) : undefined
            }
            footerSlot={
              message.curriculumAdded ? (
                <OnyxCurriculumBadge topicLabel={message.curriculumTopicLabel} />
              ) : null
            }
          />
        )}
      </div>
    </div>
  );
});

export type OnyxMessageListProps = {
  messages: OnyxMessageListItem[];
  isCoach: boolean;
  studentId?: string;
  continueIndex: number | null;
  continuingIndex: number | null;
  isFinished: boolean;
  onContinueAt: (index: number) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
};

export const OnyxMessageList = memo(function OnyxMessageList({
  messages,
  isCoach,
  studentId,
  continueIndex,
  continuingIndex,
  isFinished,
  onContinueAt,
  messagesEndRef,
}: OnyxMessageListProps) {
  return (
    <>
      {messages.map((msg, i) =>
        msg.role === "user" ? (
          <OnyxUserMessageRow key={`user-${i}`} message={msg} />
        ) : (
          <OnyxAssistantMessageRow
            key={`onyx-${i}`}
            message={msg}
            index={i}
            isCoach={isCoach}
            studentId={studentId}
            showContinue={!isFinished && continueIndex === i}
            continueLoading={continuingIndex === i}
            showCopy={isCoach}
            onContinueAt={onContinueAt}
          />
        )
      )}
      <div ref={messagesEndRef} className="h-px w-full shrink-0" aria-hidden />
    </>
  );
});
