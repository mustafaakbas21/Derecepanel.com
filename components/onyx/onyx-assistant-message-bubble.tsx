"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";

import {
  displayOnyxReplyContent,
  hasAnalysisCompleteMarker,
} from "@/lib/onyx/continuity";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OnyxMarkdownMessage = dynamic(
  () =>
    import("@/components/onyx/onyx-markdown-message").then((m) => ({
      default: m.OnyxMarkdownMessage,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="animate-pulse text-sm text-slate-500">İçerik yükleniyor…</p>
    ),
  }
);

export type OnyxAssistantMessageBubbleProps = {
  content: string;
  className?: string;
  bubbleClassName?: string;
  showContinue?: boolean;
  continueLoading?: boolean;
  onContinue?: () => void;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  /** Akış devam ederken ağır Markdown/KaTeX render'ını atla */
  streaming?: boolean;
};

export const OnyxAssistantMessageBubble = memo(function OnyxAssistantMessageBubble({
  content,
  className,
  bubbleClassName,
  showContinue = false,
  continueLoading = false,
  onContinue,
  headerSlot,
  footerSlot,
  streaming = false,
}: OnyxAssistantMessageBubbleProps) {
  const completed = hasAnalysisCompleteMarker(content);
  const displayContent = displayOnyxReplyContent(content);

  return (
    <div className={cn("relative w-full max-w-[90%]", className)}>
      <div
        className={cn(
          "relative rounded-3xl rounded-tl-sm border border-slate-200 bg-white px-6 py-5 shadow-sm",
          completed && "pb-8",
          bubbleClassName
        )}
      >
        {headerSlot}
        {streaming ? (
          <p className="whitespace-pre-wrap pr-10 text-sm leading-relaxed text-slate-800 md:text-base">
            {displayContent}
          </p>
        ) : (
          <OnyxMarkdownMessage content={displayContent} />
        )}
        {footerSlot}

        {completed ? (
          <span
            className="pointer-events-none absolute bottom-3 right-4 inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 shadow-sm"
            title="Tamamlandı"
            aria-label="Analiz tamamlandı"
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Tamamlandı
          </span>
        ) : null}
      </div>

      {showContinue && onContinue ? (
        <div className="mt-2 flex justify-start pl-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={continueLoading}
            onClick={onContinue}
            className="h-8 rounded-full border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {continueLoading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            )}
            Yanıtın tamamını getir
          </Button>
        </div>
      ) : null}
    </div>
  );
});
