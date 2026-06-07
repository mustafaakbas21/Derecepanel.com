"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  GraduationCap,
  ListOrdered,
  Loader2,
  MapPin,
  Pencil,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { GoalNetProgressBar } from "@/components/student/goal-net-progress-bar";
import { DepartmentPlacedNets } from "@/components/student/department-placed-nets";
import {
  buildPriorityBranches,
  computeHedefNetTotals,
  HedefLastExamStrip,
  HedefPriorityBranches,
  HedefProgramBadges,
  HedefProgramFacts,
  HedefTercihOverview,
} from "@/components/student/hedef-detail-sections";
import { HedefPickerModal } from "@/components/student/hedef-picker-modal";
import { TercihListModal } from "@/components/yks-sim/tercih-list-modal";
import { TercihSortableList } from "@/components/yks-sim/tercih-sortable-list";
import { Button } from "@/components/ui/button";
import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { OGRENCI_YKS_SIM_ROUTES } from "@/lib/coach/yks-sim-nav-config";
import { formatAtlasSira, formatAtlasTaban } from "@/lib/format/numbers";
import { computeGoalNetProgress } from "@/lib/yks-sim/goal-net-progress";
import { fetchAtlasProgram } from "@/lib/yks-sim/fetch-atlas";
import { type BranchSpecItem, type NetBand } from "@/lib/yks-sim/net-resolve";
import { shortRadarLabel } from "@/components/yks-sim/net-sihirbazi-branch-row";
import {
  computeNsBranchNetsFromRecord,
  formatGoalLabelFromTarget,
  getCurrentUser,
  getLastExamRecord,
  readStudentTargetForUser,
} from "@/lib/yks-sim/student-sim-bridge";
import {
  readTercihList,
  TERCIH_LIST_CHANGE,
  type TercihListItem,
} from "@/lib/yks-sim/tercih-list-storage";
import type { NsBranchId, StudentTargetPayload } from "@/lib/yks-sim/types";
import type { ExamResultRow } from "@/lib/exams/types";
import { onExamResultsChange } from "@/lib/exams/events";
import { cn } from "@/lib/utils";

const NetRadarChart = dynamic(
  () => import("@/components/yks-sim/net-radar-chart").then((m) => m.NetRadarChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    ),
  }
);

function formatSetAt(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function MetricTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "accent" | "warn";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "accent" && "border-orange-200/80 bg-orange-50/50",
        tone === "warn" && "border-amber-200/80 bg-amber-50/50",
        tone === "default" && "border-slate-200/80 bg-white"
      )}
      style={tone === "default" ? { boxShadow: "var(--card-shadow-sm)" } : undefined}
    >
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-[12px] text-slate-500">{sub}</p> : null}
    </div>
  );
}

export function HedeflerPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [target, setTarget] = useState<StudentTargetPayload | null>(null);
  const [tercihList, setTercihList] = useState<TercihListItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);

  const [spec, setSpec] = useState<BranchSpecItem[]>([]);
  const [placedNets, setPlacedNets] = useState<Partial<Record<NsBranchId, number>>>({});
  const [netBands, setNetBands] = useState<Partial<Record<NsBranchId, NetBand>>>({});
  const [studentNets, setStudentNets] = useState<Partial<Record<NsBranchId, number>>>({});
  const [netLoading, setNetLoading] = useState(false);
  const [netSource, setNetSource] = useState<"json" | "model" | "">("");
  const [lastExam, setLastExam] = useState<ExamResultRow | null>(null);

  const reload = useCallback(() => {
    const u = getCurrentUser();
    setTarget(readStudentTargetForUser(u));
    setTercihList(readTercihList(u));
    setLastExam(getLastExamRecord(u));
    setReady(true);
  }, []);

  useEffect(() => {
    reload();
    const onTarget = () => reload();
    const onList = () => reload();
    window.addEventListener("derece:student-target-changed", onTarget);
    window.addEventListener(TERCIH_LIST_CHANGE, onList);
    return () => {
      window.removeEventListener("derece:student-target-changed", onTarget);
      window.removeEventListener(TERCIH_LIST_CHANGE, onList);
    };
  }, [reload]);

  useEffect(() => {
    if (ready && !getCurrentUser()) router.replace("/");
  }, [ready, router]);

  useEffect(() => {
    const refreshExamNets = () => {
      const u = getCurrentUser();
      const last = getLastExamRecord(u);
      setLastExam(last);
      setStudentNets(last ? computeNsBranchNetsFromRecord(last) : {});
    };
    refreshExamNets();
    return onExamResultsChange(refreshExamNets);
  }, [target?.programKodu]);

  useEffect(() => {
    const kod = String(target?.programKodu || "").trim();
    if (!kod) {
      setSpec([]);
      setPlacedNets({});
      setNetBands({});
      setNetSource("");
      return;
    }
    setNetLoading(true);
    void fetchAtlasProgram(kod)
      .then((detail) => {
        setSpec(detail.spec);
        setPlacedNets(detail.nets);
        setNetBands(detail.bands);
        setNetSource(detail.source);
        const u = getCurrentUser();
        const last = getLastExamRecord(u);
        setLastExam(last);
        setStudentNets(last ? computeNsBranchNetsFromRecord(last) : {});
      })
      .catch(() => {
        setSpec([]);
        setNetBands({});
      })
      .finally(() => setNetLoading(false));
  }, [target?.programKodu]);

  const goalLabel = formatGoalLabelFromTarget(target);
  const hasTarget = Boolean(goalLabel);

  const diagnosis = useMemo(() => {
    if (!spec.length) return { total: null as number | null, worst: "", deficitCount: 0 };
    let totalDef = 0;
    let worstLabel = "";
    let worstAmt = -1;
    let deficitCount = 0;
    for (const br of spec) {
      const st = studentNets[br.id];
      if (st == null || !Number.isFinite(st)) continue;
      const mid = placedNets[br.id];
      if (mid == null || !Number.isFinite(mid)) continue;
      const def = Math.max(0, mid - st);
      if (def > 0) deficitCount += 1;
      totalDef += def;
      if (def > worstAmt) {
        worstAmt = def;
        worstLabel = br.label;
      }
    }
    const hasExam = Object.keys(studentNets).length > 0;
    if (!hasExam) return { total: null, worst: "", deficitCount: 0 };
    return {
      total: Math.round(totalDef * 10) / 10,
      worst: worstAmt > 0 ? worstLabel : "",
      deficitCount,
    };
  }, [spec, placedNets, studentNets]);

  const radarData = useMemo(
    () =>
      spec.map((br) => ({
        subject: shortRadarLabel(br.id, br.label),
        yerlesen: placedNets[br.id] ?? 0,
        ogrenci: studentNets[br.id] ?? 0,
      })),
    [spec, placedNets, studentNets]
  );

  const goalProgress = useMemo(
    () => computeGoalNetProgress(spec, placedNets, studentNets),
    [spec, placedNets, studentNets]
  );

  const primaryTercih = useMemo(
    () => tercihList.find((t) => t.sira === 1) ?? tercihList[0],
    [tercihList]
  );

  const { placedTotal, studentTotal } = useMemo(
    () => computeHedefNetTotals(spec, placedNets, studentNets),
    [spec, placedNets, studentNets]
  );

  const priorityBranches = useMemo(
    () => buildPriorityBranches(spec, placedNets, studentNets),
    [spec, placedNets, studentNets]
  );

  const simUser = getCurrentUser();

  if (!ready) {
    return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  }

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Hedeflerim"
        description="Üniversite ve bölüm hedefinizi yönetin; tercih listeniz ve net analiziniz tek ekranda."
        meta={hasTarget ? `Son güncelleme: ${formatSetAt(target?.setAt) || "—"}` : undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={() => setPickerOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Hedefi değiştir
            </Button>
            <Button type="button" variant="outline" onClick={() => setListModalOpen(true)}>
              <ListOrdered className="mr-2 h-4 w-4" />
              Tercih listesi ({tercihList.length})
            </Button>
          </div>
        }
      />

      {!hasTarget ? (
        <div
          className={cn(LIBRARY_PANEL_CLASS, "flex flex-col items-center px-6 py-16 text-center")}
        >
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "#fff7ed" }}
          >
            <Target className="h-8 w-8 text-orange-500" strokeWidth={2} />
          </div>
          <p className="text-xl font-bold text-slate-900">Henüz hedef belirlemedin</p>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-slate-500">
            YÖK Atlas veritabanından hedef üniversite ve bölümünü seç. Tercih Sihirbazı filtreleri
            ve Net Sihirbazı net analizi ile entegre çalışır.
          </p>
          <Button type="button" variant="primary" className="mt-6" onClick={() => setPickerOpen(true)}>
            İlk hedefimi belirle
          </Button>
        </div>
      ) : (
        <>
          {/* Ana hedef hero */}
          <section
            className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="border-b border-slate-100 bg-slate-900 px-6 py-5 text-white">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Birincil hedef
              </p>
              <h2 className="mt-1 text-2xl font-bold leading-snug">{target?.universite}</h2>
              <p className="mt-1 text-lg text-slate-300">{target?.bolum}</p>
              <HedefProgramBadges target={target!} primaryTercih={primaryTercih} />
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricTile
                label="Taban puan"
                value={formatAtlasTaban(target?.taban)}
                sub={target?.year ? `${target.year} yerleşme` : undefined}
                tone="accent"
              />
              <MetricTile
                label="Başarı sırası"
                value={formatAtlasSira(target?.basari)}
                sub={target?.puanTipi || "Puan tipi"}
              />
              <MetricTile
                label="Hedef net"
                value={placedTotal != null ? placedTotal.toFixed(1) : "—"}
                sub="Yerleşen toplam"
              />
              <MetricTile
                label="Senin netin"
                value={studentTotal != null ? studentTotal.toFixed(1) : "—"}
                sub={lastExam?.examName ? "Son deneme" : "Deneme gerekli"}
                tone={studentTotal != null ? "default" : "warn"}
              />
              <MetricTile
                label="Net açığı"
                value={
                  diagnosis.total != null
                    ? diagnosis.total > 0
                      ? `−${diagnosis.total}`
                      : "0"
                    : "—"
                }
                sub={
                  diagnosis.total != null
                    ? diagnosis.worst
                      ? `En zayıf: ${diagnosis.worst}`
                      : "Branş karşılaştırması"
                    : "Deneme sonucu gerekli"
                }
                tone={diagnosis.total != null && diagnosis.total > 0 ? "warn" : "default"}
              />
              <MetricTile
                label="Hedef ilerleme"
                value={goalProgress ? `%${Math.round(goalProgress.progressPct)}` : "—"}
                sub={
                  goalProgress
                    ? goalProgress.remaining > 0
                      ? `~${goalProgress.remaining} net kaldı`
                      : "Hedefe uygun"
                    : "Net analizi gerekli"
                }
                tone={
                  goalProgress && goalProgress.remaining <= 0 ? "accent" : "default"
                }
              />
            </div>
            <div className="flex flex-wrap gap-4 border-t border-slate-100 px-6 py-4 text-sm text-slate-600">
              {target?.sehir ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {target.sehir}
                </span>
              ) : null}
              {target?.fakulteYO ? (
                <span className="text-slate-500">{target.fakulteYO}</span>
              ) : null}
              {target?.programKodu ? (
                <span className="font-mono text-xs text-slate-400">{target.programKodu}</span>
              ) : null}
            </div>
            {target?.programKodu ? (
              <div className="space-y-5 border-t border-slate-100 px-6 py-5">
                <HedefProgramFacts
                  target={target}
                  primaryTercih={primaryTercih}
                  placedTotal={placedTotal}
                  netSource={netSource || undefined}
                />
                <HedefLastExamStrip
                  lastExam={lastExam}
                  studentTotal={studentTotal}
                  placedTotal={placedTotal}
                  goalProgress={netLoading ? null : goalProgress}
                />
                <DepartmentPlacedNets
                  spec={spec}
                  placedNets={placedNets}
                  studentNets={studentNets}
                  bands={netBands}
                  loading={netLoading}
                />
                <GoalNetProgressBar progress={netLoading ? null : goalProgress} />
              </div>
            ) : null}
          </section>

          {/* Net analizi */}
          {target?.programKodu ? (
            <section className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}>
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Net hedef analizi</h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Yerleşen net bandı vs son deneme netlerin — Net Sihirbazı verisi
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={OGRENCI_YKS_SIM_ROUTES.net}>
                      Net Sihirbazı
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {netLoading ? (
                <div className="flex min-h-[280px] items-center justify-center text-slate-500">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Netler yükleniyor…
                </div>
              ) : spec.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  Bu program için net verisi bulunamadı.
                </div>
              ) : (
                <div className="grid gap-6 p-5 lg:grid-cols-2 lg:p-6">
                  <div className="min-h-[280px]">
                    <NetRadarChart data={radarData} />
                  </div>
                  <div className="space-y-3">
                    {diagnosis.total != null && diagnosis.total > 0 ? (
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                          <div>
                            <p className="font-semibold text-amber-950">
                              Toplam ~{diagnosis.total} net açığın var
                            </p>
                            <p className="mt-0.5 text-sm text-amber-900/80">
                              {diagnosis.deficitCount} branşta hedefin altındasın
                              {diagnosis.worst ? ` · öncelik: ${diagnosis.worst}` : ""}.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : diagnosis.total === 0 ? (
                      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                          <p className="font-semibold text-emerald-950">
                            Son denemene göre hedef net bandına uygun görünüyorsun.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                        Son deneme sonucun bulunamadı. Deneme yükledikten sonra net karşılaştırması
                        burada görünür.
                      </div>
                    )}

                    <HedefPriorityBranches branches={priorityBranches} />

                    <GoalNetProgressBar progress={goalProgress} showBranches showSummary={false} />
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {/* Tercih listesi önizleme */}
          <section className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tercih listem</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Sürükleyerek sırala — 1. sıra birincil hedefinle senkronize olur
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={OGRENCI_YKS_SIM_ROUTES.tercih}>
                  Tercih Sihirbazı
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="space-y-2 p-5 sm:p-6">
              <HedefTercihOverview items={tercihList} />
              {tercihList.length === 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4">
                  <GraduationCap className="mt-0.5 h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-800">Tercih listen boş</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Hedef seçerken otomatik eklenir veya Tercih Sihirbazından genişletebilirsin.
                    </p>
                  </div>
                </div>
              ) : (
                <TercihSortableList
                  items={tercihList}
                  simUser={simUser}
                  onChange={reload}
                  variant="cards"
                  showActions={false}
                />
              )}
              {tercihList.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => setListModalOpen(true)}
                >
                  Tüm listeyi yönet
                </Button>
              ) : null}
            </div>
          </section>

          {/* Hızlı bağlantılar */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                href: OGRENCI_YKS_SIM_ROUTES.tercih,
                title: "Tercih Sihirbazı",
                desc: "Atlas filtreleri ile tercih listesi oluştur",
              },
              {
                href: OGRENCI_YKS_SIM_ROUTES.net,
                title: "Net Sihirbazı",
                desc: "Branş bazlı net karşılaştırması",
              },
              {
                href: OGRENCI_YKS_SIM_ROUTES.puan,
                title: "Puan Hesaplama",
                desc: "Ham puan ve OBP simülasyonu",
              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-slate-300"
                style={{ boxShadow: "var(--card-shadow-sm)" }}
              >
                <p className="font-semibold text-slate-900 group-hover:text-slate-700">
                  {link.title}
                </p>
                <p className="mt-1 text-[13px] text-slate-500">{link.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      <HedefPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSaved={reload}
      />

      <TercihListModal
        open={listModalOpen}
        onOpenChange={setListModalOpen}
        mode="student"
        selectedStudentId=""
        onSelectedStudentIdChange={() => {}}
        onListChange={reload}
      />
    </div>
  );
}
