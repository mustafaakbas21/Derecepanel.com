"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  LayoutGrid,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import { ProgressRing } from "@/components/konu-takip/progress-ring";
import { Input } from "@/components/ui/input";
import { useKonuTakip } from "@/hooks/use-konu-takip";
import { KONU_TAKIP_ROUTES } from "@/lib/coach/konu-takip-nav-config";
import { summarizeDers, summarizeStudent } from "@/lib/konu-takip/aggregate";
import {
  KONU_TAKIP_HANDOFF_KEY,
  KONU_TAKIP_HANDOFF_SUBJECT_KEY,
} from "@/lib/konu-takip/constants";
import { clearHandoff, setHandoff } from "@/lib/panel-store/handoff";
import { formatRelativeDate } from "@/lib/konu-takip/format";
import { getDerslerByTrack } from "@/lib/mufredat";
import type { MufredatTrack } from "@/lib/mufredat/types";
import { getInitials } from "@/lib/students/constants";
import { useStudentsFull } from "@/lib/students/use-students-full";
import { cn } from "@/lib/utils";

type TrackFilter = MufredatTrack | "ALL";
type SortKey = "name" | "ratio" | "done" | "solved" | "activity";
type SortDir = "asc" | "desc";

const TRACK_TABS: { id: TrackFilter; label: string }[] = [
  { id: "TYT", label: "TYT" },
  { id: "AYT", label: "AYT" },
  { id: "ALL", label: "Tümü" },
];

function ratioCellClass(ratio: number, hasData: boolean): string {
  if (!hasData) return "bg-slate-50 text-slate-300";
  if (ratio >= 0.67) return "bg-emerald-50 text-emerald-700";
  if (ratio >= 0.34) return "bg-amber-50 text-amber-700";
  if (ratio > 0) return "bg-rose-50 text-rose-600";
  return "bg-slate-50 text-slate-400";
}

export function KonuTakipGenelBakisPage() {
  const { students, hydrated: studentsHydrated } = useStudentsFull();
  const { store, hydrated: storeHydrated } = useKonuTakip();
  const router = useRouter();

  const [track, setTrack] = useState<TrackFilter>("TYT");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const dersler = useMemo(() => getDerslerByTrack(track), [track]);

  const activeStudents = useMemo(
    () =>
      students
        .filter((s) => s.status === "aktif" || s.status === "donduruldu")
        .sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [students]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeStudents;
    return activeStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q)
    );
  }, [activeStudents, search]);

  const rows = useMemo(
    () =>
      filtered.map((s) => {
        const tracking = store[s.ogrenciId] ?? {};
        return {
          student: s,
          overall: summarizeStudent(tracking, track),
          cells: dersler.map((d) => summarizeDers(tracking, d)),
        };
      }),
    [filtered, store, track, dersler]
  );

  const sortedRows = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case "ratio":
          return (a.overall.ratio - b.overall.ratio) * dir;
        case "done":
          return (a.overall.doneTopics - b.overall.doneTopics) * dir;
        case "solved":
          return (a.overall.solved - b.overall.solved) * dir;
        case "activity":
          return (
            ((a.overall.lastActivity ?? "").localeCompare(
              b.overall.lastActivity ?? ""
            )) * dir
          );
        default:
          return a.student.name.localeCompare(b.student.name, "tr") * dir;
      }
    });
  }, [rows, sortKey, sortDir]);

  const stats = useMemo(() => {
    const list = activeStudents.map((s) =>
      summarizeStudent(store[s.ogrenciId] ?? {}, track)
    );
    const count = list.length;
    const avg = count > 0 ? list.reduce((a, b) => a + b.ratio, 0) / count : 0;
    const totalSolved = list.reduce((a, b) => a + b.solved, 0);
    const activeCount = list.filter((s) => s.lastActivity).length;
    return { count, avg, totalSolved, activeCount };
  }, [activeStudents, store, track]);

  /** Görünen öğrenciler üzerinden sınıf ortalaması (özet satırı). */
  const classAvg = useMemo(() => {
    const n = rows.length;
    if (n === 0) return null;
    const ratio = rows.reduce((a, r) => a + r.overall.ratio, 0) / n;
    const done = rows.reduce((a, r) => a + r.overall.doneTopics, 0) / n;
    const totalTopics = rows[0]?.overall.totalTopics ?? 0;
    const solved = rows.reduce((a, r) => a + r.overall.solved, 0);
    const cellRatios = dersler.map(
      (_, i) => rows.reduce((a, r) => a + (r.cells[i]?.ratio ?? 0), 0) / n
    );
    return { ratio, done, totalTopics, solved, cellRatios };
  }, [rows, dersler]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const openStudent = (ogrenciId: string, subjectId?: string) => {
    setHandoff(KONU_TAKIP_HANDOFF_KEY, ogrenciId);
    if (subjectId) setHandoff(KONU_TAKIP_HANDOFF_SUBJECT_KEY, subjectId);
    else clearHandoff(KONU_TAKIP_HANDOFF_SUBJECT_KEY);
    router.push(KONU_TAKIP_ROUTES.takip);
  };

  const hydrated = studentsHydrated && storeHydrated;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
            <LayoutGrid className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Genel Bakış</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Tüm öğrencilerin konu tamamlama oranları ve çözdükleri soru sayıları.
              Bir satıra tıklayarak o öğrencinin konu takibine geçin.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <OverviewStatCard
          icon={<Users className="h-4 w-4" />}
          label="Öğrenci"
          value={stats.count}
          sub={`${stats.activeCount} aktif takip`}
        />
        <OverviewStatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Ortalama tamamlama"
          value={`%${Math.round(stats.avg * 100)}`}
          sub={track === "ALL" ? "TYT + AYT" : track}
        />
        <OverviewStatCard
          icon={<BookOpenCheck className="h-4 w-4" />}
          label="Toplam çözülen soru"
          value={stats.totalSolved.toLocaleString("tr-TR")}
        />
        <OverviewStatCard
          icon={<LayoutGrid className="h-4 w-4" />}
          label="Takip edilen ders"
          value={dersler.length}
          sub="Seçili filtre"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {TRACK_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrack(t.id)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
                track === t.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-11 border-slate-200 bg-slate-50/50 pl-9"
            placeholder="Öğrenci ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
          <span className="text-slate-400">{filtered.length} öğrenci</span>
          <LegendDot className="bg-emerald-400" label="≥67%" />
          <LegendDot className="bg-amber-400" label="34–66%" />
          <LegendDot className="bg-rose-400" label="1–33%" />
          <LegendDot className="bg-slate-200" label="Veri yok" />
        </div>
      </div>

      {!hydrated ? (
        <p className="py-16 text-center text-sm text-slate-500">Yükleniyor…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <p className="text-base font-semibold text-slate-800">
            {activeStudents.length === 0 ? "Henüz öğrenci yok" : "Sonuç bulunamadı"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {activeStudents.length === 0
              ? "Önce Öğrencilerim sayfasından kayıt ekleyin."
              : "Arama kriterinize uygun öğrenci bulunamadı."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                <th className="sticky left-0 z-10 bg-slate-50/80 px-4 py-3">
                  <SortHeader
                    label="Öğrenci"
                    active={sortKey === "name"}
                    dir={sortDir}
                    onClick={() => toggleSort("name")}
                  />
                </th>
                <th className="px-3 py-3 text-center">
                  <SortHeader
                    label="Genel"
                    align="center"
                    active={sortKey === "ratio"}
                    dir={sortDir}
                    onClick={() => toggleSort("ratio")}
                  />
                </th>
                <th className="px-3 py-3 text-center">
                  <SortHeader
                    label="Biten konu"
                    align="center"
                    active={sortKey === "done"}
                    dir={sortDir}
                    onClick={() => toggleSort("done")}
                  />
                </th>
                <th className="px-3 py-3 text-right">
                  <SortHeader
                    label="Soru"
                    align="right"
                    active={sortKey === "solved"}
                    dir={sortDir}
                    onClick={() => toggleSort("solved")}
                  />
                </th>
                <th className="whitespace-nowrap px-3 py-3">
                  <SortHeader
                    label="Son aktivite"
                    active={sortKey === "activity"}
                    dir={sortDir}
                    onClick={() => toggleSort("activity")}
                  />
                </th>
                {dersler.map((d) => (
                  <th
                    key={d.id}
                    className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                    title={d.dersAdi}
                  >
                    <span className="block max-w-[80px] truncate">{d.dersAdi}</span>
                  </th>
                ))}
                <th className="w-8 px-2 py-3" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {classAvg && (
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <td className="sticky left-0 z-10 bg-slate-50/60 px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                        <TrendingUp className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Sınıf ortalaması
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-center">
                      <ProgressRing ratio={classAvg.ratio} size={34} stroke={4} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs font-semibold tabular-nums text-slate-600">
                    {classAvg.done.toFixed(1)}
                    <span className="text-slate-400">/{classAvg.totalTopics}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold tabular-nums text-slate-700">
                    {classAvg.solved.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-3 py-2.5" />
                  {classAvg.cellRatios.map((r, i) => (
                    <td key={dersler[i]?.id ?? i} className="px-2 py-2.5 text-center">
                      <span className="text-[11px] font-bold tabular-nums text-slate-500">
                        {Math.round(r * 100)}%
                      </span>
                    </td>
                  ))}
                  <td className="px-2 py-2.5" aria-hidden />
                </tr>
              )}
              {sortedRows.map(({ student, overall, cells }) => (
                <tr
                  key={student.ogrenciId}
                  onClick={() => openStudent(student.ogrenciId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openStudent(student.ogrenciId);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50/80 focus:bg-slate-50 focus:outline-none"
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                        {getInitials(student.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {student.name}
                        </p>
                        <DistributionBar
                          done={overall.doneTopics}
                          inProgress={overall.inProgressTopics}
                          total={overall.totalTopics}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <ProgressRing ratio={overall.ratio} size={38} stroke={4} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums text-slate-700">
                    <span className="font-bold text-slate-900">{overall.doneTopics}</span>
                    <span className="text-slate-400">/{overall.totalTopics}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-900">
                    {overall.solved}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                    {overall.lastActivity ? (
                      formatRelativeDate(overall.lastActivity)
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  {cells.map((c) => {
                    const hasData = c.doneTopics + c.inProgressTopics > 0;
                    return (
                      <td key={c.subjectId} className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openStudent(student.ogrenciId, c.subjectId);
                          }}
                          title={`${c.subjectName}: ${c.doneTopics}/${c.totalTopics} konu · ${c.solved} soru`}
                          className={cn(
                            "inline-flex min-w-[44px] items-center justify-center rounded-lg px-1.5 py-1 text-xs font-bold tabular-nums transition hover:ring-2 hover:ring-slate-300",
                            ratioCellClass(c.ratio, hasData)
                          )}
                        >
                          {Math.round(c.ratio * 100)}%
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-2 py-3 text-slate-300">
                    <ChevronRight className="h-4 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OverviewStatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2.5 w-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}

function SortHeader({
  label,
  active,
  dir,
  align = "left",
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  align?: "left" | "center" | "right";
  onClick: () => void;
}) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors",
        active ? "text-slate-700" : "text-slate-400 hover:text-slate-600",
        align === "center" && "justify-center",
        align === "right" && "justify-end"
      )}
    >
      {label}
      <Icon
        className={cn(
          "h-3.5 w-3.5 transition-opacity",
          active ? "opacity-100" : "opacity-40 group-hover:opacity-70"
        )}
      />
    </button>
  );
}

function DistributionBar({
  done,
  inProgress,
  total,
}: {
  done: number;
  inProgress: number;
  total: number;
}) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div
      className="mt-1 flex h-1.5 w-32 max-w-full overflow-hidden rounded-full bg-slate-100"
      title={`Bitti ${done} · Çalışılıyor ${inProgress} · Toplam ${total}`}
    >
      <div className="h-full bg-emerald-500" style={{ width: `${pct(done)}%` }} />
      <div className="h-full bg-amber-400" style={{ width: `${pct(inProgress)}%` }} />
    </div>
  );
}
