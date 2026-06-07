"use client";

import { Camera, MessageSquare, Sparkles, X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChatSessionSummary } from "@/lib/onyx-client";
import { studentDisplayName, studentSelectValue } from "@/lib/onyx/coach-students";
import type { StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
  students: StudentRecord[];
  studentsReady: boolean;
  selectedStudentId: string;
  onStudentChange: (id: string) => void;
  selectDisabled: boolean;
  sessions: ChatSessionSummary[];
  sessionsLoading: boolean;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  showStudentSelect?: boolean;
  className?: string;
};

export function OnyxChatHistorySidebar({
  open,
  onClose,
  students,
  studentsReady,
  selectedStudentId,
  onStudentChange,
  selectDisabled,
  sessions,
  sessionsLoading,
  activeSessionId,
  onSelectSession,
  onNewChat,
  showStudentSelect = true,
  className,
}: Props) {
  return (
    <aside
      id="onyx-chat-history-sidebar"
      aria-label="Sohbet geçmişi"
      aria-hidden={!open}
      className={cn(
        "onyx-sidebar-drawer onyx-sidebar-drawer--left",
        open && "onyx-sidebar-drawer--open",
        className
      )}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-slate-200/80 px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-amber-300">
                <Sparkles size={16} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Onyx</p>
                <p className="text-[11px] text-slate-500">Sohbet geçmişi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="onyx-toolbar-btn"
              aria-label="Paneli kapat"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          {showStudentSelect ? (
            <>
              <label
                htmlFor="onyx-sidebar-student"
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Aktif öğrenci
              </label>
              <Select
                value={selectedStudentId || undefined}
                onValueChange={onStudentChange}
                disabled={selectDisabled}
              >
                <SelectTrigger
                  id="onyx-sidebar-student"
                  className="h-9 w-full rounded-xl border-slate-200 bg-white text-xs shadow-sm"
                >
                  <SelectValue
                    placeholder={
                      !studentsReady
                        ? "Yükleniyor…"
                        : students.length === 0
                          ? "Öğrenci yok"
                          : "Öğrenci seçin"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => {
                    const value = studentSelectValue(s);
                    return (
                      <SelectItem key={value} value={value}>
                        {studentDisplayName(s)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
          <button
            type="button"
            disabled={!selectedStudentId}
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="mb-3 w-full rounded-full border border-slate-200 bg-white py-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            Yeni sohbet başlat
          </button>

          <p className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <MessageSquare size={14} aria-hidden />
            Geçmiş
          </p>

          <div className="min-h-0 flex-1 overflow-y-auto px-0.5">
            {!selectedStudentId ? (
              <p className="px-2 py-4 text-xs leading-relaxed text-slate-400">
                Sohbet geçmişi için önce bir öğrenci seçin.
              </p>
            ) : sessionsLoading ? (
              <div className="space-y-2 px-1 py-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-[4.5rem] animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="px-2 py-4 text-xs leading-relaxed text-slate-400">
                Henüz kayıtlı sohbet yok. Yeni bir sohbet başlattığınızda burada
                listelenir; fotoğraflı sorular da saklanır.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {sessions.map((session) => {
                  const active = activeSessionId === session.id;
                  return (
                    <li key={session.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSession(session.id);
                          onClose();
                        }}
                        className={cn(
                          "onyx-history-item flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                          active
                            ? "bg-white shadow-sm ring-1 ring-slate-200/90"
                            : "hover:bg-white/80"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                            session.hasImage
                              ? "border-amber-200/80 bg-amber-50 text-amber-700"
                              : "border-slate-200/80 bg-slate-50 text-slate-500"
                          )}
                          aria-hidden
                        >
                          {session.hasImage ? (
                            <Camera size={16} />
                          ) : (
                            <MessageSquare size={16} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span
                              className={cn(
                                "line-clamp-1 text-[13px] font-semibold leading-snug",
                                active ? "text-slate-900" : "text-slate-800"
                              )}
                            >
                              {session.title}
                            </span>
                            <span className="shrink-0 text-[10px] text-slate-400">
                              {formatRelativeTime(session.lastMessageAt)}
                            </span>
                          </span>
                          <span className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                            {session.preview}
                          </span>
                          <span className="mt-1 inline-flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{session.messageCount} mesaj</span>
                            {session.hasImage ? (
                              <span className="text-amber-600/90">· Görsel</span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
