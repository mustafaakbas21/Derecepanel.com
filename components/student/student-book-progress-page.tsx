"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookCheck,
  BookOpen,
  CircleDashed,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";

import { StudentAssignmentProgressRow } from "@/components/student/student-assignment-progress-row";
import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LIBRARY_PANEL_INNER,
  LibraryEmptyState,
  LibraryPageHeader,
  LibraryProgressBar,
  LibrarySectionTitle,
} from "@/components/library/library-shell";
import { Button } from "@/components/ui/button";
import { useStudentLibrary } from "@/hooks/use-student-library";
import { bookSubjectLabel } from "@/lib/library/book-meta";
import { STUDENT_KITAP_ROUTES } from "@/lib/student/sidebar-nav-config";
import { cn } from "@/lib/utils";

type TabKey = "active" | "completed" | "all";

export function StudentBookProgressPage() {
  const { assignments, stats, coachName, hydrated, updateProgress } = useStudentLibrary();
  const [tab, setTab] = useState<TabKey>("active");

  const grouped = useMemo(() => {
    const active = assignments.filter((a) => a.progress > 0 && a.progress < 100);
    const completed = assignments.filter((a) => a.progress >= 100);
    const notStarted = assignments.filter((a) => a.progress <= 0);
    return { active, completed, notStarted, all: assignments };
  }, [assignments]);

  const visible = useMemo(() => {
    if (tab === "active") return [...grouped.notStarted, ...grouped.active];
    if (tab === "completed") return grouped.completed;
    return grouped.all;
  }, [grouped, tab]);

  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, { label: string; total: number; sum: number }>();
    for (const item of assignments) {
      if (!item.book) continue;
      const id = item.book.subjectId || "other";
      const label = bookSubjectLabel(item.book);
      const prev = map.get(id) ?? { label, total: 0, sum: 0 };
      prev.total += 1;
      prev.sum += item.progress;
      map.set(id, prev);
    }
    return [...map.values()]
      .map((v) => ({ ...v, avg: v.total ? Math.round(v.sum / v.total) : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [assignments]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Kitap ilerlemem"
        description="Atanan kaynaklardaki ilerlemenizi güncelleyin. Koç paneli ile anlık senkronize olur."
        meta={coachName ? `Koçunuz: ${coachName}` : undefined}
        action={
          stats.total > 0 ? (
            <Button variant="outline" asChild>
              <Link href={STUDENT_KITAP_ROUTES.atanan}>Atanan kitaplar</Link>
            </Button>
          ) : null
        }
      />

      {stats.total > 0 ? (
        <>
          <section
            className="overflow-hidden rounded-2xl bg-slate-900 text-white"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Genel ilerleme
                </p>
                <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
                  %{stats.avgProgress}
                </p>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-300">
                  {stats.completed} kaynak tamamlandı · {stats.inProgress} devam ediyor ·{" "}
                  {stats.notStarted} henüz başlanmadı
                </p>
                <div className="mt-4 max-w-md">
                  <LibraryProgressBar value={stats.avgProgress} className="[&_span]:text-slate-400 [&_span:last-child]:text-white [&>div:last-child]:bg-slate-700 [&>div:last-child>div]:bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:gap-2">
                <MetricPill icon={Target} label="Toplam" value={String(stats.total)} />
                <MetricPill icon={BookOpen} label="Devam" value={String(stats.inProgress + stats.notStarted)} />
                <MetricPill icon={BookCheck} label="Bitti" value={String(stats.completed)} />
              </div>
            </div>
          </section>

          {subjectBreakdown.length > 0 ? (
            <div className={LIBRARY_PANEL_CLASS} style={{ boxShadow: "var(--card-shadow-sm)" }}>
              <div className={LIBRARY_PANEL_INNER}>
                <LibrarySectionTitle
                  title="Ders bazında"
                  subtitle="Her dersteki kaynak sayısı ve ortalama ilerleme"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subjectBreakdown.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{row.label}</p>
                        <span className="shrink-0 text-xs text-slate-500">{row.total} kaynak</span>
                      </div>
                      <LibraryProgressBar value={row.avg} className="mt-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <div className={LIBRARY_PANEL_CLASS} style={{ boxShadow: "var(--card-shadow-sm)" }}>
        <div className={LIBRARY_PANEL_INNER}>
          {stats.total === 0 ? (
            <LibraryEmptyState
              title="İlerleme takibi için kaynak yok"
              description="Koçunuz size kaynak atadığında buradan ilerlemenizi işaretleyebilirsiniz."
              action={
                <Button variant="outline" asChild>
                  <Link href={STUDENT_KITAP_ROUTES.atanan}>Atanan kitaplara git</Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
                <TabButton
                  active={tab === "active"}
                  onClick={() => setTab("active")}
                  count={grouped.notStarted.length + grouped.active.length}
                >
                  Devam eden
                </TabButton>
                <TabButton
                  active={tab === "completed"}
                  onClick={() => setTab("completed")}
                  count={grouped.completed.length}
                >
                  Tamamlanan
                </TabButton>
                <TabButton active={tab === "all"} onClick={() => setTab("all")} count={grouped.all.length}>
                  Tümü
                </TabButton>
              </div>

              {visible.length === 0 ? (
                <LibraryEmptyState
                  title={
                    tab === "completed"
                      ? "Henüz tamamlanan kaynak yok"
                      : "Tüm kaynaklar tamamlandı"
                  }
                  description={
                    tab === "completed"
                      ? "Bir kaynağı %100'e getirdiğinizde burada görünür."
                      : "Harika! Tüm atanan kaynakları bitirdiniz."
                  }
                />
              ) : (
                <div className="space-y-4">
                  {visible.map((item) => (
                    <StudentAssignmentProgressRow
                      key={item.id}
                      item={item}
                      onProgressChange={updateProgress}
                    />
                  ))}
                </div>
              )}

              {grouped.notStarted.length > 0 && tab === "active" ? (
                <p className="flex items-center gap-2 pt-2 text-xs text-slate-500">
                  <CircleDashed className="h-3.5 w-3.5" />
                  {grouped.notStarted.length} kaynak henüz başlanmadı — slider veya hızlı yüzde
                  butonlarıyla güncelleyin.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
      <Icon className="h-5 w-5 shrink-0 text-slate-300" />
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      )}
    >
      {children}
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] tabular-nums",
          active ? "bg-white/15 text-white" : "bg-white text-slate-600"
        )}
      >
        {count}
      </span>
    </button>
  );
}
