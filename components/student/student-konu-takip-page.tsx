"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpenCheck,
  LayoutGrid,
  Search,
} from "lucide-react";

import { FilterSegments } from "@/components/appointments/filter-segments";
import { ProgressRing } from "@/components/konu-takip/progress-ring";
import { StudentTopicRow } from "@/components/konu-takip/student-topic-row";
import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudentKonuTakip } from "@/hooks/use-student-konu-takip";
import { summarizeDers, summarizeStudent } from "@/lib/konu-takip/aggregate";
import { TOPIC_STATUS_LABELS } from "@/lib/konu-takip/constants";
import { topicKey } from "@/lib/konu-takip/storage";
import type { TopicStatus } from "@/lib/konu-takip/types";
import { subjectExists } from "@/lib/konu-takip/student-queries";
import { STUDENT_KONU_TAKIP_ROUTES } from "@/lib/student/sidebar-nav-config";
import { getDerslerByTrack, getTopics } from "@/lib/mufredat";
import type { MufredatTrack } from "@/lib/mufredat/types";
import { cn } from "@/lib/utils";

type TrackFilter = MufredatTrack | "ALL";
type StatusFilter = "all" | TopicStatus;

const TRACK_TABS: { value: TrackFilter; label: string }[] = [
  { value: "TYT", label: "TYT" },
  { value: "AYT", label: "AYT" },
  { value: "ALL", label: "Tümü" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "baslanmadi", label: TOPIC_STATUS_LABELS.baslanmadi },
  { value: "calisiliyor", label: TOPIC_STATUS_LABELS.calisiliyor },
  { value: "bitti", label: TOPIC_STATUS_LABELS.bitti },
];

export function StudentKonuTakipPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, studentId, tracking, coachName, hydrated } = useStudentKonuTakip();

  const [track, setTrack] = useState<TrackFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [highlightTopicId, setHighlightTopicId] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  const dersler = useMemo(() => getDerslerByTrack(track), [track]);

  useEffect(() => {
    const dersParam = searchParams.get("ders") ?? "";
    const konuParam = searchParams.get("konu") ?? "";
    const trackParam = searchParams.get("track") as TrackFilter | null;
    if (trackParam && ["TYT", "AYT", "ALL"].includes(trackParam)) setTrack(trackParam);
    if (dersParam && subjectExists(dersParam)) {
      setSelectedSubjectId(dersParam);
    }
    if (konuParam) {
      setHighlightTopicId(konuParam);
      setSearch("");
      setStatusFilter("all");
    }
    if (dersParam && subjectExists(dersParam)) return;
    if (dersler.length === 0) return;
    if (selectedSubjectId && dersler.some((d) => d.id === selectedSubjectId)) return;
    setSelectedSubjectId(dersler[0]!.id);
  }, [searchParams, dersler, selectedSubjectId]);

  const studentSummary = useMemo(
    () => summarizeStudent(tracking, track),
    [tracking, track]
  );

  const dersSummaries = useMemo(
    () => dersler.map((d) => summarizeDers(tracking, d)),
    [dersler, tracking]
  );

  const topics = useMemo(() => {
    if (!selectedSubjectId) return [];
    const q = search.trim().toLowerCase();
    return getTopics(selectedSubjectId).filter((t) => {
      if (q && !t.name.toLowerCase().includes(q)) return false;
      if (statusFilter === "all") return true;
      const p = tracking[topicKey(selectedSubjectId, t.id)];
      return (p?.status ?? "baslanmadi") === statusFilter;
    });
  }, [selectedSubjectId, search, statusFilter, tracking]);

  useEffect(() => {
    if (!highlightTopicId) return;
    const el = document.getElementById(`konu-row-${highlightTopicId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = window.setTimeout(() => setHighlightTopicId(null), 6000);
    return () => window.clearTimeout(t);
  }, [highlightTopicId, selectedSubjectId, topics.length]);

  const selectedDers = dersSummaries.find((d) => d.subjectId === selectedSubjectId);

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

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Konu Durumum"
        description={`${coachName} ile paylaşılan müfredat ilerlemeniz. Durum ve çözülen sorular anında koç paneline yansır.`}
        meta={`${studentSummary.doneTopics}/${studentSummary.totalTopics} konu bitti · ${studentSummary.solved} soru çözüldü`}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href={STUDENT_KONU_TAKIP_ROUTES.genelBakis}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Genel Bakış
            </Link>
          </Button>
        }
      />

      {/* Özet şerit */}
      <section
        className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <div className="flex flex-wrap items-center gap-4 px-5 py-5 sm:px-6">
          <ProgressRing ratio={studentSummary.ratio} size={64} stroke={6} />
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <MetricPill
              label="Bitti"
              value={studentSummary.doneTopics}
              sub={`/${studentSummary.totalTopics} konu`}
              tone="success"
            />
            <MetricPill label="Çalışılıyor" value={studentSummary.inProgressTopics} tone="warn" />
            <MetricPill label="Çözülen soru" value={studentSummary.solved} />
          </div>
        </div>
      </section>

      {/* Filtreler */}
      <section className={cn(LIBRARY_PANEL_CLASS, "space-y-3 p-4 sm:p-5")}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-10 border-slate-200 bg-slate-50/50 pl-9"
              placeholder="Konu ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <FilterSegments
            ariaLabel="Durum filtresi"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {TRACK_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTrack(t.value)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition",
                track === t.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Ders listesi */}
        <aside className={cn(LIBRARY_PANEL_CLASS, "space-y-2 p-3 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto")}>
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Dersler
          </p>
          {dersSummaries.map((d) => {
            const active = d.subjectId === selectedSubjectId;
            return (
              <button
                key={d.subjectId}
                type="button"
                onClick={() => setSelectedSubjectId(d.subjectId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                  active
                    ? "border-slate-900 bg-slate-900/[0.03] shadow-sm"
                    : "border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-white"
                )}
              >
                <ProgressRing ratio={d.ratio} size={40} stroke={4} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {d.subjectName}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        d.track === "TYT"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-violet-100 text-violet-700"
                      )}
                    >
                      {d.track}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {d.doneTopics}/{d.totalTopics} bitti
                  </span>
                </span>
              </button>
            );
          })}
        </aside>

        {/* Konu listesi */}
        <section className="min-w-0 space-y-3">
          {selectedDers ? (
            <div
              className={cn(LIBRARY_PANEL_CLASS, "flex flex-wrap items-center justify-between gap-4 p-4")}
            >
              <div className="flex items-center gap-3">
                <ProgressRing ratio={selectedDers.ratio} size={48} stroke={5} />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedDers.subjectName}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedDers.doneTopics} bitti · {selectedDers.inProgressTopics} devam ·{" "}
                    {selectedDers.totalTopics - selectedDers.doneTopics - selectedDers.inProgressTopics}{" "}
                    başlanmadı
                  </p>
                </div>
              </div>
              <p className="text-sm tabular-nums text-slate-600">
                {selectedDers.solved} soru çözüldü
              </p>
            </div>
          ) : null}

          {topics.length === 0 ? (
            <div
              className={cn(
                LIBRARY_PANEL_CLASS,
                "flex flex-col items-center gap-2 px-6 py-16 text-center"
              )}
            >
              <BookOpenCheck className="h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-800">
                {search || statusFilter !== "all" ? "Sonuç bulunamadı" : "Konu yok"}
              </p>
              <p className="max-w-sm text-sm text-slate-500">
                Filtreleri değiştirin veya başka bir ders seçin.
              </p>
            </div>
          ) : (
            topics.map((t) => (
              <StudentTopicRow
                key={t.id}
                studentId={studentId}
                subjectId={selectedSubjectId}
                highlighted={highlightTopicId === t.id}
                topicId={t.id}
                topicName={t.name}
                progress={tracking[topicKey(selectedSubjectId, t.id)]}
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "default" | "success" | "warn";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "success" && "border-emerald-200/80 bg-emerald-50/50",
        tone === "warn" && "border-amber-200/80 bg-amber-50/50",
        tone === "default" && "border-slate-200/80 bg-slate-50/60"
      )}
    >
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">
        {value}
        {sub ? <span className="text-base font-semibold text-slate-400">{sub}</span> : null}
      </p>
    </div>
  );
}
