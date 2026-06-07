"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Clock,
  ListChecks,
  TrendingUp,
} from "lucide-react";

import { ProgressRing } from "@/components/konu-takip/progress-ring";
import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { Button } from "@/components/ui/button";
import { useStudentKonuTakip } from "@/hooks/use-student-konu-takip";
import { summarizeDers, summarizeStudent } from "@/lib/konu-takip/aggregate";
import { TOPIC_STATUS_LABELS } from "@/lib/konu-takip/constants";
import { formatRelativeDate } from "@/lib/konu-takip/format";
import {
  countByStatus,
  listDeficitTopics,
  listRecentTopics,
} from "@/lib/konu-takip/student-queries";
import { STUDENT_KONU_TAKIP_ROUTES } from "@/lib/student/sidebar-nav-config";
import { getDerslerByTrack } from "@/lib/mufredat";
import type { MufredatTrack } from "@/lib/mufredat/types";
import { cn } from "@/lib/utils";

type TrackFilter = MufredatTrack | "ALL";

const TRACK_TABS: { value: TrackFilter; label: string }[] = [
  { value: "TYT", label: "TYT" },
  { value: "AYT", label: "AYT" },
  { value: "ALL", label: "Tümü" },
];

export function StudentKonuTakipGenelBakisPage() {
  const router = useRouter();
  const { user, studentId, tracking, coachName, hydrated } = useStudentKonuTakip();
  const [track, setTrack] = useState<TrackFilter>("ALL");

  useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  const summary = useMemo(() => summarizeStudent(tracking, track), [tracking, track]);
  const statusCounts = useMemo(() => countByStatus(tracking, track), [tracking, track]);
  const dersler = useMemo(
    () => getDerslerByTrack(track).map((d) => summarizeDers(tracking, d)),
    [track, tracking]
  );
  const deficitTopics = useMemo(
    () => listDeficitTopics(tracking, track, 10),
    [tracking, track]
  );
  const recentTopics = useMemo(() => listRecentTopics(tracking, track, 6), [tracking, track]);

  const weakestSubjects = useMemo(
    () =>
      [...dersler]
        .filter((d) => d.totalTopics > 0 && d.ratio < 1)
        .sort((a, b) => a.ratio - b.ratio)
        .slice(0, 4),
    [dersler]
  );

  if (!hydrated) {
    return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  }

  if (!user || !studentId) {
    return (
      <p className="text-sm text-slate-500">
        Oturum bulunamadı.{" "}
        <Link href="/" className="font-medium text-slate-900 underline">
          Giriş sayfasına dön
        </Link>
      </p>
    );
  }

  const pct = Math.round(summary.ratio * 100);

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Genel Bakış"
        description={`TYT/AYT müfredatında genel ilerlemeniz. ${coachName} koç panelinde aynı veriyi görür.`}
        meta={
          summary.lastActivity
            ? `Son aktivite: ${formatRelativeDate(summary.lastActivity)}`
            : "Henüz konu güncellemesi yok"
        }
        action={
          <Button variant="primary" size="sm" asChild>
            <Link href={STUDENT_KONU_TAKIP_ROUTES.durum}>
              <ListChecks className="mr-2 h-4 w-4" />
              Konu Durumum
            </Link>
          </Button>
        }
      />

      {/* Hero */}
      <section
        className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <div className="border-b border-slate-100 bg-slate-900 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Müfredat tamamlanma
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">%{pct}</p>
              <p className="mt-1 text-sm text-slate-300">
                {summary.doneTopics} / {summary.totalTopics} konu bitti
              </p>
            </div>
            <ProgressRing ratio={summary.ratio} size={80} stroke={7} variant="onDark" />
          </div>
        </div>

        <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <StatCell
            icon={CheckCircle2}
            label="Bitti"
            value={String(statusCounts.bitti)}
            sub={`/${statusCounts.total}`}
            tone="success"
          />
          <StatCell
            icon={TrendingUp}
            label="Çalışılıyor"
            value={String(statusCounts.calisiliyor)}
            tone="warn"
          />
          <StatCell
            icon={CircleDashed}
            label="Başlanmadı"
            value={String(statusCounts.baslanmadi)}
          />
          <StatCell icon={BookOpen} label="Çözülen soru" value={String(summary.solved)} />
        </div>
      </section>

      {/* Track tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm">
        {TRACK_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTrack(t.value)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none",
              track === t.value
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Ders grid */}
      <section className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}>
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h3 className="text-lg font-bold text-slate-900">Ders bazlı ilerleme</h3>
          <p className="mt-0.5 text-sm text-slate-500">Derse tıklayarak konu listesine geçin</p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:p-5">
          {dersler.map((d) => (
            <Link
              key={d.subjectId}
              href={`${STUDENT_KONU_TAKIP_ROUTES.durum}?ders=${d.subjectId}&track=${d.track}`}
              className="group rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 group-hover:text-slate-700">
                    {d.subjectName}
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      d.track === "TYT"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-violet-100 text-violet-700"
                    )}
                  >
                    {d.track}
                  </span>
                </div>
                <ProgressRing ratio={d.ratio} size={44} stroke={4} />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{ width: `${Math.round(d.ratio * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {d.doneTopics}/{d.totalTopics} bitti · {d.solved} soru
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Eksik konular */}
        <section className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}>
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-slate-900">Öncelikli konular</h3>
              <p className="text-xs text-slate-500">Henüz bitmeyen veya devam eden konular</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {deficitTopics.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Tebrikler — filtrelenen kapsamda eksik konu kalmadı.
              </p>
            ) : (
              deficitTopics.map((t) => (
                <Link
                  key={`${t.subjectId}-${t.topicId}`}
                  href={`${STUDENT_KONU_TAKIP_ROUTES.durum}?ders=${t.subjectId}&track=${t.track}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{t.topicName}</p>
                    <p className="truncate text-xs text-slate-500">{t.subjectName}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      t.progress.status === "calisiliyor"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {TOPIC_STATUS_LABELS[t.progress.status]}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Son aktivite */}
        <section className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}>
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Clock className="h-5 w-5 text-slate-500" />
            <div>
              <h3 className="font-bold text-slate-900">Son güncellemeler</h3>
              <p className="text-xs text-slate-500">Senin veya koçunun son dokunuşları</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTopics.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Henüz güncellenmiş konu yok. Konu Durumum&apos;dan ilk konunu işaretle.
              </p>
            ) : (
              recentTopics.map((t) => (
                <Link
                  key={`${t.subjectId}-${t.topicId}`}
                  href={`${STUDENT_KONU_TAKIP_ROUTES.durum}?ders=${t.subjectId}&track=${t.track}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{t.topicName}</p>
                    <p className="text-xs text-slate-500">
                      {t.subjectName} · {TOPIC_STATUS_LABELS[t.progress.status]}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {formatRelativeDate(t.progress.updatedAt)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Zayıf dersler */}
      {weakestSubjects.length > 0 ? (
        <section className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}>
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h3 className="text-lg font-bold text-slate-900">Geliştirilmesi gereken dersler</h3>
            <p className="mt-0.5 text-sm text-slate-500">En düşük tamamlanma oranına sahip dersler</p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            {weakestSubjects.map((d) => (
              <Link
                key={d.subjectId}
                href={`${STUDENT_KONU_TAKIP_ROUTES.durum}?ders=${d.subjectId}&track=${d.track}`}
                className="flex items-center gap-4 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 transition hover:border-amber-300"
              >
                <ProgressRing ratio={d.ratio} size={48} stroke={5} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{d.subjectName}</p>
                  <p className="text-sm text-slate-600">
                    {d.doneTopics}/{d.totalTopics} konu · %{Math.round(d.ratio * 100)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "warn";
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          tone === "success" && "bg-emerald-50 text-emerald-600",
          tone === "warn" && "bg-amber-50 text-amber-600",
          tone === "default" && "bg-slate-100 text-slate-500"
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div>
        <p className="text-[12px] font-medium text-slate-500">{label}</p>
        <p className="text-xl font-bold tabular-nums text-slate-900">
          {value}
          {sub ? <span className="text-sm font-semibold text-slate-400">{sub}</span> : null}
        </p>
      </div>
    </div>
  );
}
