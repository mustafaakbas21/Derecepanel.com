"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CheckCheck, ListChecks, RotateCcw, Search } from "lucide-react";

import { ProgressRing } from "@/components/konu-takip/progress-ring";
import { StudentPicker } from "@/components/konu-takip/student-picker";
import { TopicRow } from "@/components/konu-takip/topic-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/hooks/use-confirm";
import { useKonuTakip } from "@/hooks/use-konu-takip";
import {
  KONU_TAKIP_HANDOFF_KEY,
  KONU_TAKIP_HANDOFF_SUBJECT_KEY,
  TOPIC_STATUS_LABELS,
} from "@/lib/konu-takip/constants";
import { takeHandoff } from "@/lib/panel-store/handoff";
import { summarizeDers, summarizeStudent } from "@/lib/konu-takip/aggregate";
import { setDersStatus, topicKey } from "@/lib/konu-takip/storage";
import type { TopicStatus } from "@/lib/konu-takip/types";
import { toast } from "@/lib/notify";
import { getDersById, getDerslerByTrack, getTopics } from "@/lib/mufredat";
import type { MufredatTrack } from "@/lib/mufredat/types";
import { useStudentsFull } from "@/lib/students/use-students-full";
import { cn } from "@/lib/utils";

type TrackFilter = MufredatTrack | "ALL";
type StatusFilter = "all" | TopicStatus;

const TRACK_TABS: { id: TrackFilter; label: string }[] = [
  { id: "TYT", label: "TYT" },
  { id: "AYT", label: "AYT" },
  { id: "ALL", label: "İkisi de" },
];

export function KonuTakipPage() {
  const { students, hydrated: studentsHydrated } = useStudentsFull();
  const { store, hydrated: storeHydrated } = useKonuTakip();
  const { confirm, ConfirmHost } = useConfirm();

  const [studentId, setStudentId] = useState("");
  const [track, setTrack] = useState<TrackFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const activeStudents = useMemo(
    () =>
      students
        .filter((s) => s.status === "aktif" || s.status === "donduruldu")
        .sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [students]
  );

  useEffect(() => {
    if (!studentsHydrated) return;
    if (studentId && activeStudents.some((s) => s.ogrenciId === studentId)) return;

    const handoff = takeHandoff(KONU_TAKIP_HANDOFF_KEY) ?? "";
    if (handoff && activeStudents.some((s) => s.ogrenciId === handoff)) {
      setStudentId(handoff);
      const subj = takeHandoff(KONU_TAKIP_HANDOFF_SUBJECT_KEY) ?? "";
      if (subj && getDersById(subj)) setSelectedSubjectId(subj);
    } else if (activeStudents.length > 0) {
      setStudentId(activeStudents[0].ogrenciId);
    }
  }, [studentsHydrated, activeStudents, studentId]);

  const dersler = useMemo(() => getDerslerByTrack(track), [track]);

  useEffect(() => {
    if (dersler.length === 0) return;
    if (selectedSubjectId && dersler.some((d) => d.id === selectedSubjectId)) return;
    setSelectedSubjectId(dersler[0].id);
  }, [dersler, selectedSubjectId]);

  const tracking = useMemo(() => store[studentId] ?? {}, [store, studentId]);

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
      const status: TopicStatus = p?.status ?? "baslanmadi";
      return status === statusFilter;
    });
  }, [selectedSubjectId, search, statusFilter, tracking]);

  const selectedStudent = activeStudents.find((s) => s.ogrenciId === studentId);
  const selectedDers = dersSummaries.find((d) => d.subjectId === selectedSubjectId);
  const notStarted = selectedDers
    ? selectedDers.totalTopics - selectedDers.doneTopics - selectedDers.inProgressTopics
    : 0;
  const hydrated = studentsHydrated && storeHydrated;

  const bulkSetSelectedDers = async (status: TopicStatus) => {
    if (!studentId || !selectedSubjectId || !selectedDers) return;
    const ids = (getDersById(selectedSubjectId)?.konular ?? []).map((k) => k.id);
    if (ids.length === 0) return;

    if (status === "baslanmadi") {
      const ok = await confirm({
        title: "Ders durumlarını sıfırla",
        description: `${selectedDers.subjectName} dersindeki ${ids.length} konunun durumu "Başlanmadı" yapılacak. Çözülen soru, hedef, kaynak ve notlar korunur.`,
        confirmLabel: "Sıfırla",
        destructive: true,
      });
      if (!ok) return;
    }

    setDersStatus(studentId, selectedSubjectId, ids, status);
    toast.success(
      status === "bitti"
        ? `${selectedDers.subjectName}: ${ids.length} konu "Bitti" işaretlendi`
        : `${selectedDers.subjectName}: durumlar sıfırlandı`
    );
  };

  return (
    <div className="space-y-6">
      {ConfirmHost}
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          <ListChecks className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Konu Takibi</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Öğrenci bazında konuların durumu, çözülen soru sayısı ve kullanılan
            kaynaklar tek ekranda.
          </p>
        </div>
      </header>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[240px] flex-1 sm:max-w-sm">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Öğrenci ara ve seç
            </label>
            <StudentPicker
              students={activeStudents}
              value={studentId}
              onChange={setStudentId}
            />
          </div>

          {selectedStudent && (
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-2.5">
              <ProgressRing ratio={studentSummary.ratio} size={52} stroke={6} />
              <div className="flex items-center divide-x divide-slate-200">
                <SummaryStat
                  label="Biten konu"
                  value={`${studentSummary.doneTopics}/${studentSummary.totalTopics}`}
                  dot="bg-emerald-500"
                />
                <SummaryStat
                  label="Çalışılan"
                  value={studentSummary.inProgressTopics}
                  dot="bg-amber-500"
                />
                <SummaryStat label="Çözülen soru" value={studentSummary.solved} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Filtrele
          </span>
          <div className="min-w-[160px]">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger aria-label="Durum filtresi" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm durumlar</SelectItem>
                <SelectItem value="baslanmadi">{TOPIC_STATUS_LABELS.baslanmadi}</SelectItem>
                <SelectItem value="calisiliyor">{TOPIC_STATUS_LABELS.calisiliyor}</SelectItem>
                <SelectItem value="bitti">{TOPIC_STATUS_LABELS.bitti}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-10 border-slate-200 bg-slate-50/50 pl-9"
              placeholder="Konu ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!hydrated ? (
        <p className="py-16 text-center text-sm text-slate-500">Yükleniyor…</p>
      ) : activeStudents.length === 0 ? (
        <EmptyCard
          title="Henüz öğrenci yok"
          description="Önce Öğrencilerim sayfasından kayıt ekleyin, ardından konu takibine başlayın."
        />
      ) : !studentId ? (
        <EmptyCard
          title="Bir öğrenci seçin"
          description="Yukarıdaki listeden öğrenci seçtiğinizde konuları takip edebilirsiniz."
        />
      ) : (
        <div className="grid min-w-0 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Dersler
              </p>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                {TRACK_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTrack(t.id)}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors",
                      track === t.id
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

          <div className="space-y-2 lg:max-h-[calc(100vh-300px)] lg:overflow-y-auto lg:pr-1">
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
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
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
                      {d.doneTopics}/{d.totalTopics} konu · {d.solved} soru
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          </aside>

          <section className="min-w-0 space-y-3">
            {selectedDers && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <ProgressRing ratio={selectedDers.ratio} size={48} stroke={5} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {selectedDers.subjectName}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                          selectedDers.track === "TYT"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-violet-100 text-violet-700"
                        )}
                      >
                        {selectedDers.track}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selectedDers.totalTopics} konu · {selectedDers.solved} soru çözüldü
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <BreakdownChip
                      label="Bitti"
                      value={selectedDers.doneTopics}
                      dot="bg-emerald-500"
                    />
                    <BreakdownChip
                      label="Çalışılıyor"
                      value={selectedDers.inProgressTopics}
                      dot="bg-amber-500"
                    />
                    <BreakdownChip
                      label="Başlanmadı"
                      value={notStarted}
                      dot="bg-slate-300"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bulkSetSelectedDers("bitti")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Hepsini bitti işaretle
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkSetSelectedDers("baslanmadi")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Sıfırla
                    </button>
                  </div>
                </div>
              </div>
            )}

            {topics.length === 0 ? (
              <EmptyCard
                title={
                  search || statusFilter !== "all"
                    ? "Sonuç bulunamadı"
                    : "Konu bulunamadı"
                }
                description={
                  search || statusFilter !== "all"
                    ? "Filtre veya arama kriterinizi değiştirin."
                    : "Bu derse ait konu kaydı yok."
                }
              />
            ) : (
              topics.map((t) => (
                <TopicRow
                  key={t.id}
                  studentId={studentId}
                  subjectId={selectedSubjectId}
                  topicId={t.id}
                  topicName={t.name}
                  progress={tracking[topicKey(selectedSubjectId, t.id)]}
                />
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  dot,
}: {
  label: string;
  value: number | string;
  dot?: string;
}) {
  return (
    <div className="min-w-[68px] px-3 first:pl-0 last:pr-0">
      <p className="text-lg font-bold tabular-nums text-slate-900">{value}</p>
      <p className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
        {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
        {label}
      </p>
    </div>
  );
}

function BreakdownChip({
  label,
  value,
  dot,
}: {
  label: string;
  value: number;
  dot: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700">
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      <span className="tabular-nums">{value}</span>
      <span className="font-medium text-slate-400">{label}</span>
    </span>
  );
}

function EmptyCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <BookOpenCheck className="h-6 w-6" />
      </span>
      <p className="text-base font-semibold text-slate-800">{title}</p>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}
