"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  ChevronRight,
  FileText,
  Globe2,
  Loader2,
  Minus,
  Search,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SonucReportModal } from "@/components/exams/sonuc-merkezi/sonuc-report-modal";
import { ExamTypeBadge } from "@/components/exams/exam-type-badge";
import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LIBRARY_PANEL_INNER,
  LibraryEmptyState,
  LibraryFilterBar,
  LibraryInsights,
  LibraryPageHeader,
  LibrarySectionTitle,
} from "@/components/library/library-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentExamResults } from "@/lib/student/use-student-exam-results";
import { findExamById } from "@/lib/exams/exam-storage";
import { buildSelectedStudentKarnesFragment, downloadKarnePdf } from "@/lib/karne";
import { STUDENT_DENEME_ROUTES } from "@/lib/student/sidebar-nav-config";
import {
  buildStudentResultViews,
  computeStudentResultsStats,
  filterStudentResultViews,
  type StudentResultView,
} from "@/lib/student/student-exam-results-view";
import { cn } from "@/lib/utils";

import "@/components/exams/sonuc-merkezi/karne-screen.css";
import "@/components/exams/sonuc-merkezi/sonuc-merkezi-modals.css";
import "@/styles/print-a4-global.css";
import "@/styles/sonuc-merkezi-print.css";

function NetLineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload?: { examName?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg"
      style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.12)" }}
    >
      <p className="font-semibold text-slate-900">{label}</p>
      {payload[0]?.payload?.examName ? (
        <p className="text-xs text-slate-500">{payload[0].payload.examName}</p>
      ) : null}
      <p className="text-slate-600">{payload[0]?.value} net</p>
    </div>
  );
}

function DyBTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-semibold text-slate-900">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function StudentExamResultsPage() {
  const { results, netTrend, hydrated, studentIds } = useStudentExamResults();
  const [scope, setScope] = useState<"all" | "kurumsal" | "global">("all");
  const [sinav, setSinav] = useState<"all" | "TYT" | "AYT" | "YDT">("all");
  const [search, setSearch] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("Karne");
  const [reportHtml, setReportHtml] = useState("");

  const views = useMemo(() => buildStudentResultViews(results), [results]);
  const stats = useMemo(() => computeStudentResultsStats(views), [views]);
  const filtered = useMemo(
    () => filterStudentResultViews(views, { scope, sinav, search }),
    [views, scope, sinav, search]
  );

  const dybChart = useMemo(() => {
    return [...views]
      .slice(0, 6)
      .reverse()
      .map((v) => ({
        name: v.examName.slice(0, 12),
        fullName: v.examName,
        Doğru: v.correct,
        Yanlış: v.wrong,
        Boş: v.blank,
      }));
  }, [views]);

  const openKarneModal = (view: StudentResultView) => {
    const exam = findExamById(view.examId);
    if (!exam) return;
    const html = buildSelectedStudentKarnesFragment(exam, [view.result]);
    setReportTitle(`${view.examName} · Deneme karnem`);
    setReportHtml(html);
    setReportOpen(true);
  };

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
        title="Deneme sonuçlarım"
        description="Koç panelindeki Sonuç Merkezi ile aynı karne ve veri kaynağı. Deneme satırına tıklayarak detaylı karnenizi görüntüleyin."
        meta={
          stats.total
            ? `${stats.total} deneme · Ort. ${stats.avgNet ?? "—"} net`
            : "Henüz sonuç kaydı yok"
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={STUDENT_DENEME_ROUTES.kurumsal}>Deneme takvimi</Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href={STUDENT_DENEME_ROUTES.analiz}>Analiz merkezim</Link>
            </Button>
          </div>
        }
      />

      {stats.total > 0 ? (
        <>
          <LibraryInsights
            metrics={[
              {
                label: "Toplam deneme",
                value: stats.total,
                sub: `${stats.kurumsalCount} kurumsal · ${stats.globalCount} global`,
                icon: FileText,
              },
              {
                label: "Son net",
                value: stats.lastNet ?? "—",
                sub:
                  stats.trendDelta != null
                    ? `${stats.trendDelta >= 0 ? "+" : ""}${stats.trendDelta} öncekine göre`
                    : "İlk kayıt",
                icon: TrendingUp,
              },
              {
                label: "En yüksek net",
                value: stats.bestNet ?? "—",
                sub: stats.avgNet != null ? `Ortalama ${stats.avgNet}` : undefined,
                icon: Trophy,
              },
              {
                label: "Doğru / Yanlış",
                value: `${stats.totalCorrect}/${stats.totalWrong}`,
                sub: `${stats.totalBlank} boş`,
                icon: Target,
              },
            ]}
          />

          {stats.lastNet != null ? (
            <section
              className="overflow-hidden rounded-2xl bg-slate-900 text-white"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Son deneme performansı
                  </p>
                  <p className="mt-2 text-4xl font-bold tabular-nums sm:text-5xl">{stats.lastNet}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {views[0]?.examName} · {views[0]?.dateLabel} · {views[0]?.sinav}
                  </p>
                  {views[0]?.genelRank ? (
                    <p className="mt-1 text-sm text-slate-400">
                      Kurum sıralaması:{" "}
                      <span className="font-semibold text-white">
                        {views[0].genelRank}/{views[0].participantCount}
                      </span>
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => views[0] && openKarneModal(views[0])}
                >
                  Son karnemi aç
                </Button>
              </div>
            </section>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div
              className="rounded-[1.35rem] bg-white p-6"
              style={{ boxShadow: "var(--card-shadow-sm)" }}
            >
              <LibrarySectionTitle title="Net gelişimim" subtitle="Son denemelerdeki net trendi" />
              <div className="mt-4 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={netTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      domain={["dataMin - 5", "dataMax + 5"]}
                    />
                    <Tooltip content={<NetLineTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#0f172a"
                      strokeWidth={2.5}
                      dot={{ fill: "#f97316", stroke: "#fff", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: "#f97316" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="rounded-[1.35rem] bg-white p-6"
              style={{ boxShadow: "var(--card-shadow-sm)" }}
            >
              <LibrarySectionTitle
                title="Doğru / yanlış / boş"
                subtitle="Son 6 deneme — cevap dağılımı"
              />
              <div className="mt-4 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dybChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<DyBTooltip />} />
                    <Bar dataKey="Doğru" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Yanlış" stackId="a" fill="#dc2626" />
                    <Bar dataKey="Boş" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <ScopeTab active={scope === "all"} onClick={() => setScope("all")} count={views.length}>
          Tümü
        </ScopeTab>
        <ScopeTab
          active={scope === "kurumsal"}
          onClick={() => setScope("kurumsal")}
          count={stats.kurumsalCount}
        >
          Kurumsal
        </ScopeTab>
        <ScopeTab
          active={scope === "global"}
          onClick={() => setScope("global")}
          count={stats.globalCount}
        >
          Global
        </ScopeTab>
      </div>

      <div className={LIBRARY_PANEL_CLASS} style={{ boxShadow: "var(--card-shadow-sm)" }}>
        <div className={LIBRARY_PANEL_INNER}>
          {stats.total === 0 ? (
            <LibraryEmptyState
              title="Henüz sonuç kaydı yok"
              description="Koçunuz sonuç yüklediğinde denemeleriniz burada listelenir; satıra tıklayarak koç panelindeki ile aynı karnenizi görürsünüz."
              action={
                <Button variant="outline" asChild>
                  <Link href={STUDENT_DENEME_ROUTES.kurumsal}>Deneme takvimine git</Link>
                </Button>
              }
            />
          ) : (
            <>
              <LibraryFilterBar trailing={`${filtered.length} / ${views.length} sonuç`}>
                <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Deneme ara…"
                    className="pl-9"
                  />
                </div>
                <Select value={sinav} onValueChange={(v) => setSinav(v as typeof sinav)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sınav" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm sınavlar</SelectItem>
                    <SelectItem value="TYT">TYT</SelectItem>
                    <SelectItem value="AYT">AYT</SelectItem>
                    <SelectItem value="YDT">YDT</SelectItem>
                  </SelectContent>
                </Select>
              </LibraryFilterBar>

              {filtered.length === 0 ? (
                <LibraryEmptyState
                  title="Filtreye uygun sonuç yok"
                  description="Arama veya filtreleri değiştirin."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setSinav("all");
                        setScope("all");
                      }}
                    >
                      Filtreleri temizle
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {filtered.map((view) => (
                    <StudentResultRow
                      key={`${view.examId}-${view.result.savedAt}`}
                      view={view}
                      onOpen={() => openKarneModal(view)}
                      onPdf={() => {
                        const sid = view.result.studentId || studentIds[0];
                        if (sid) downloadKarnePdf(view.examId, sid);
                      }}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      <SonucReportModal
        open={reportOpen}
        title={reportTitle}
        html={reportHtml}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}

function StudentResultRow({
  view,
  onOpen,
  onPdf,
}: {
  view: StudentResultView;
  onOpen: () => void;
  onPdf: () => void;
}) {
  return (
    <li>
      <div
        className="group flex w-full flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center sm:p-5"
        style={{ boxShadow: "var(--card-shadow-sm)" }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen();
            }
          }}
          className="flex min-w-0 flex-1 cursor-pointer flex-col gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 sm:flex-row sm:items-center"
        >
          <div
            className={cn(
              "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border",
              view.net != null && view.net >= (view.participantCount ? 0 : 0)
                ? "border-slate-900/10 bg-slate-900 text-white"
                : "border-slate-100 bg-slate-50 text-slate-900"
            )}
          >
            <span className="text-2xl font-bold tabular-nums leading-none">
              {view.net ?? "—"}
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase opacity-70">net</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
                  view.isGlobal ? "bg-orange-500" : "bg-slate-900"
                )}
              >
                {view.isGlobal ? (
                  <span className="inline-flex items-center gap-1">
                    <Globe2 className="h-3 w-3" />
                    Global
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Kurumsal
                  </span>
                )}
              </span>
              <ExamTypeBadge sinav={view.sinav as "TYT" | "AYT" | "YDT"} />
              {view.netDelta != null ? (
                <Badge
                  variant={view.netDelta > 0 ? "teal" : view.netDelta < 0 ? "high" : "default"}
                  className="gap-1 font-normal"
                >
                  {view.netDelta > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : view.netDelta < 0 ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {view.netDelta >= 0 ? "+" : ""}
                  {view.netDelta}
                </Badge>
              ) : null}
            </div>
            <h3 className="mt-2 truncate text-base font-bold text-slate-900 sm:text-lg">
              {view.examName}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{view.dateLabel}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-800">
                D {view.correct}
              </span>
              <span className="rounded-md bg-rose-50 px-2 py-1 font-medium text-rose-800">
                Y {view.wrong}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                B {view.blank}
              </span>
              {view.accuracyPct != null ? (
                <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                  %{view.accuracyPct} doğruluk
                </span>
              ) : null}
              {view.genelRank ? (
                <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                  Sıra {view.genelRank}/{view.participantCount}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          <Button type="button" variant="outline" size="sm" onClick={onPdf}>
            PDF
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpen}
            className="gap-1 font-semibold text-slate-600 hover:text-slate-900"
          >
            Karne
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}

function ScopeTab({
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
        active ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
