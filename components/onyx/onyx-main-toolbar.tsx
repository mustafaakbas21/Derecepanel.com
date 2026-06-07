"use client";

import { History, MessageSquarePlus, PanelRight, Share2 } from "lucide-react";

import { OnyxToolbarStudentSelect } from "@/components/onyx/onyx-toolbar-student-select";
import type { StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

type Props = {
  onNewChat: () => void;
  onToggleHistory: () => void;
  onToggleContext: () => void;
  onShare: () => void;
  historyOpen: boolean;
  contextOpen: boolean;
  showContextToggle: boolean;
  newChatDisabled?: boolean;
  showStudentSelect?: boolean;
  students?: StudentRecord[];
  studentsReady?: boolean;
  selectedStudentId?: string;
  onStudentChange?: (id: string) => void;
  selectDisabled?: boolean;
};

export function OnyxMainToolbar({
  onNewChat,
  onToggleHistory,
  onToggleContext,
  onShare,
  historyOpen,
  contextOpen,
  showContextToggle,
  newChatDisabled,
  showStudentSelect,
  students = [],
  studentsReady,
  selectedStudentId = "",
  onStudentChange,
  selectDisabled,
}: Props) {
  return (
    <header className="onyx-toolbar relative z-30 flex shrink-0 items-center justify-between gap-2 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleHistory}
          className={cn(
            "onyx-toolbar-btn onyx-toolbar-btn--outline gap-1.5 px-3.5",
            historyOpen && "onyx-toolbar-btn--active"
          )}
          aria-label="Sohbet geçmişi"
          aria-pressed={historyOpen}
        >
          <History size={16} strokeWidth={1.75} aria-hidden />
          <span className="text-[13px] font-medium">Geçmiş</span>
        </button>
        <button
          type="button"
          onClick={onNewChat}
          disabled={newChatDisabled}
          className="onyx-toolbar-btn onyx-toolbar-btn--outline gap-1.5 px-3.5"
        >
          <MessageSquarePlus size={16} strokeWidth={1.75} aria-hidden />
          <span className="text-[13px] font-medium">Yeni Sohbet</span>
        </button>

        {showStudentSelect && onStudentChange ? (
          <OnyxToolbarStudentSelect
            students={students}
            value={selectedStudentId}
            onChange={onStudentChange}
            disabled={selectDisabled}
            studentsReady={studentsReady}
          />
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {showContextToggle ? (
          <button
            type="button"
            onClick={onToggleContext}
            className={cn(
              "onyx-toolbar-btn",
              contextOpen && "onyx-toolbar-btn--active"
            )}
            aria-label="Analiz paneli"
            aria-pressed={contextOpen}
          >
            <PanelRight size={18} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onShare}
          className="onyx-toolbar-btn onyx-toolbar-btn--outline gap-1.5 px-3.5"
          aria-label="Paylaş"
        >
          <Share2 size={15} strokeWidth={1.75} aria-hidden />
          <span className="hidden text-[13px] font-medium sm:inline">Paylaş</span>
        </button>
      </div>
    </header>
  );
}
