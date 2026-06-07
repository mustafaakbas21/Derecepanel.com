"use client";

import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";

import { shortRadarLabel } from "@/components/yks-sim/net-sihirbazi-branch-row";
import { bursDisplayLabel } from "@/lib/yks-sim/atlas-enrich";
import { bolumDiliLabel } from "@/lib/yks-sim/atlas-program-display";
import type { BranchSpecItem } from "@/lib/yks-sim/net-resolve";
import type { GoalNetProgress } from "@/lib/yks-sim/goal-net-progress";
import type { TercihListItem } from "@/lib/yks-sim/tercih-list-storage";
import type { NsBranchId, StudentTargetPayload } from "@/lib/yks-sim/types";
import { formatAtlasSira, formatAtlasTaban } from "@/lib/format/numbers";
import type { ExamResultRow } from "@/lib/exams/types";
import { OGRENCI_YKS_SIM_ROUTES } from "@/lib/coach/yks-sim-nav-config";
import { cn } from "@/lib/utils";

function parseTabanNum(v?: string): number | null {
  if (!v) return null;
  const n = parseFloat(String(v).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function fmtNet(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function sumBranchNets(
  spec: BranchSpecItem[],
  nets: Partial<Record<NsBranchId, number>>
): number | null {
  if (!spec.length) return null;
  let sum = 0;
  let count = 0;
  for (const br of spec) {
    const v = nets[br.id];
    if (v == null || !Number.isFinite(v)) continue;
    sum += v;
    count += 1;
  }
  return count > 0 ? Math.round(sum * 10) / 10 : null;
}

export function computeHedefNetTotals(
  spec: BranchSpecItem[],
  placedNets: Partial<Record<NsBranchId, number>>,
  studentNets: Partial<Record<NsBranchId, number>>
) {
  return {
    placedTotal: sumBranchNets(spec, placedNets),
    studentTotal: sumBranchNets(spec, studentNets),
  };
}

export function buildPriorityBranches(
  spec: BranchSpecItem[],
  placedNets: Partial<Record<NsBranchId, number>>,
  studentNets: Partial<Record<NsBranchId, number>>
) {
  return spec
    .map((br) => {
      const target = placedNets[br.id];
      const student = studentNets[br.id];
      if (target == null || student == null || !Number.isFinite(student)) return null;
      const deficit = Math.max(0, target - student);
      const surplus = Math.max(0, student - target);
      return {
        id: br.id,
        label: br.label,
        target,
        student,
        deficit,
        surplus,
        ok: deficit <= 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.deficit - a!.deficit) as Array<{
    id: NsBranchId;
    label: string;
    target: number;
    student: number;
    deficit: number;
    surplus: number;
    ok: boolean;
  }>;
}

export function HedefProgramBadges({
  target,
  primaryTercih,
}: {
  target: StudentTargetPayload;
  primaryTercih?: TercihListItem;
}) {
  const puanTipi = target.puanTipi || primaryTercih?.puanTipi;
  const year = target.year || primaryTercih?.year;
  const burs = primaryTercih?.bursTuru;
  const dil = primaryTercih?.bolumDili;

  const badges = [
    puanTipi ? { label: puanTipi, tone: "bg-white/15 text-white" } : null,
    year ? { label: `${year} yerleşme`, tone: "bg-white/10 text-slate-200" } : null,
    burs ? { label: bursDisplayLabel(burs), tone: "bg-orange-500/20 text-orange-100" } : null,
    dil
      ? { label: bolumDiliLabel(dil as "turkce" | "ingilizce"), tone: "bg-white/10 text-slate-200" }
      : null,
  ].filter(Boolean) as { label: string; tone: string }[];

  if (!badges.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {badges.map((b) => (
        <span
          key={b.label}
          className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", b.tone)}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

export function HedefProgramFacts({
  target,
  primaryTercih,
  placedTotal,
  netSource,
}: {
  target: StudentTargetPayload;
  primaryTercih?: TercihListItem;
  placedTotal: number | null;
  netSource?: string;
}) {
  const rows = [
    { label: "Üniversite", value: target.universite },
    { label: "Bölüm", value: target.bolum },
    { label: "Fakülte / YO", value: target.fakulteYO || primaryTercih?.fakulteYO },
    { label: "Şehir", value: target.sehir || primaryTercih?.sehir },
    { label: "Puan türü", value: target.puanTipi || primaryTercih?.puanTipi },
    { label: "Program kodu", value: target.programKodu, mono: true },
    { label: "Taban puan", value: formatAtlasTaban(target.taban || primaryTercih?.taban) },
    { label: "Başarı sırası", value: formatAtlasSira(target.basari || primaryTercih?.basari) },
    { label: "Yerleşen net (toplam)", value: placedTotal != null ? fmtNet(placedTotal) : "—" },
    ...(netSource
      ? [
          {
            label: "Net veri kaynağı",
            value: netSource === "json" ? "Atlas (gerçek)" : "Model tahmini",
          },
        ]
      : []),
  ].filter((r) => r.value && r.value !== "—");

  if (!rows.length) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        Program özeti
      </p>
      <dl className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5 rounded-lg bg-white px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {row.label}
            </dt>
            <dd
              className={cn(
                "text-sm font-semibold text-slate-900",
                row.mono && "font-mono text-xs"
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function HedefLastExamStrip({
  lastExam,
  studentTotal,
  placedTotal,
  goalProgress,
}: {
  lastExam: ExamResultRow | null;
  studentTotal: number | null;
  placedTotal: number | null;
  goalProgress: GoalNetProgress | null;
}) {
  if (!lastExam && studentTotal == null) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <div>
          <p className="font-medium text-slate-800">Son deneme sonucu yok</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Deneme sonuçların yüklendiğinde net karşılaştırması ve hedef ilerlemen burada güncellenir.
          </p>
          <Link
            href="/ogrenci/deneme-sonuclari"
            className="mt-2 inline-block text-xs font-semibold text-slate-700 underline"
          >
            Sonuçlarım →
          </Link>
        </div>
      </div>
    );
  }

  const examDate = lastExam?.savedAt
    ? new Date(lastExam.savedAt).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const gap =
    placedTotal != null && studentTotal != null
      ? Math.round((placedTotal - studentTotal) * 10) / 10
      : null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Son deneme referansı
          </p>
          <p className="mt-1 text-base font-bold text-slate-900">
            {lastExam?.examName || "Son deneme"}
          </p>
          {examDate ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              {examDate}
              {typeof lastExam?.net === "number" ? (
                <span className="text-slate-400">· genel {fmtNet(lastExam.net)} net</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center">
            <p className="text-[10px] font-bold uppercase text-slate-400">Senin netin</p>
            <p className="text-xl font-bold tabular-nums text-slate-900">{fmtNet(studentTotal)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center">
            <p className="text-[10px] font-bold uppercase text-slate-400">Hedef net</p>
            <p className="text-xl font-bold tabular-nums text-slate-900">{fmtNet(placedTotal)}</p>
          </div>
          {gap != null ? (
            <div
              className={cn(
                "rounded-xl border px-3 py-2 text-center",
                gap > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
              )}
            >
              <p className="text-[10px] font-bold uppercase text-slate-500">Fark</p>
              <p
                className={cn(
                  "text-xl font-bold tabular-nums",
                  gap > 0 ? "text-amber-800" : "text-emerald-700"
                )}
              >
                {gap > 0 ? `−${gap}` : "OK"}
              </p>
            </div>
          ) : null}
          {goalProgress ? (
            <div className="rounded-xl border border-slate-900/10 bg-slate-900 px-3 py-2 text-center text-white">
              <p className="text-[10px] font-bold uppercase text-slate-400">İlerleme</p>
              <p className="text-xl font-bold tabular-nums">%{Math.round(goalProgress.progressPct)}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function HedefPriorityBranches({
  branches,
}: {
  branches: ReturnType<typeof buildPriorityBranches>;
}) {
  const deficits = branches.filter((b) => b.deficit > 0).slice(0, 4);
  const strengths = branches.filter((b) => b.ok && b.surplus > 0).slice(0, 3);

  if (!deficits.length && !strengths.length) return null;

  return (
    <div className="space-y-4">
      {deficits.length > 0 ? (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <Target className="h-4 w-4 text-orange-500" />
            Öncelikli çalışma alanları
          </p>
          <ul className="space-y-2">
            {deficits.map((br, i) => (
              <li
                key={br.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[11px] font-bold text-amber-900">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {shortRadarLabel(br.id, br.label)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {fmtNet(br.student)} / {fmtNet(br.target)} net
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-amber-800">
                  −{fmtNet(br.deficit)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {strengths.length > 0 ? (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Hedefin üzerinde
          </p>
          <div className="flex flex-wrap gap-2">
            {strengths.map((br) => (
              <span
                key={br.id}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
              >
                {shortRadarLabel(br.id, br.label)} +{fmtNet(br.surplus)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function HedefTercihOverview({ items }: { items: TercihListItem[] }) {
  if (!items.length) return null;

  const tabanlar = items.map((i) => parseTabanNum(i.taban)).filter((n): n is number => n != null);
  const cities = new Set(items.map((i) => i.sehir).filter(Boolean));
  const puanTipleri = new Set(items.map((i) => i.puanTipi).filter(Boolean));

  const minTaban = tabanlar.length ? Math.min(...tabanlar) : null;
  const maxTaban = tabanlar.length ? Math.max(...tabanlar) : null;

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
          <GraduationCap className="h-3.5 w-3.5" />
          Toplam tercih
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{items.length}</p>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          Şehir çeşitliliği
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{cities.size}</p>
        <p className="text-[11px] text-slate-500">{puanTipleri.size} puan türü</p>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
          <Sparkles className="h-3.5 w-3.5" />
          Taban aralığı
        </p>
        <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
          {minTaban != null && maxTaban != null
            ? `${minTaban.toFixed(1)} – ${maxTaban.toFixed(1)}`
            : "—"}
        </p>
      </div>
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-emerald-700">
          <BookOpen className="h-3.5 w-3.5" />
          1. tercih
        </p>
        <p className="mt-1 truncate text-sm font-bold text-slate-900">
          {items.find((i) => i.sira === 1)?.bolum ?? items[0]?.bolum}
        </p>
        <Link
          href={OGRENCI_YKS_SIM_ROUTES.tercih}
          className="mt-1 inline-block text-[11px] font-semibold text-emerald-800 underline"
        >
          Listeyi düzenle
        </Link>
      </div>
    </div>
  );
}

export { parseTabanNum };
