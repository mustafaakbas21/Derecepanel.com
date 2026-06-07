"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Rocket,
  Target,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { StrategySkillData } from "@/lib/onyx/skill-types";
import { loadWeeklyDraft, newTaskId, saveWeeklyDraft } from "@/lib/weekly-planner/storage";
import type { WeeklyTask } from "@/lib/weekly-planner/types";
import { currentWeekMondayISO } from "@/lib/weekly-planner/student-scope";
import { appToast } from "@/lib/notify";
import { cn } from "@/lib/utils";

type Props = {
  data: StrategySkillData;
  studentId?: string;
  className?: string;
};

const GUN_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const GERCEKCIK_LABEL: Record<
  NonNullable<StrategySkillData["hedefAnalizi"]>["gerçekcilik"],
  { label: string; className: string }
> = {
  yuksek: {
    label: "Ulaşılabilir",
    className: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  },
  orta: {
    label: "Orta mesafe",
    className: "bg-amber-100 text-amber-900 ring-amber-200",
  },
  dusuk: {
    label: "Zorlu hedef",
    className: "bg-orange-100 text-orange-900 ring-orange-200",
  },
  veri_yok: {
    label: "Atlas verisi yok",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  },
};

const ONCELIK_CLASS = {
  kritik: "border-l-orange-500 bg-orange-50/60",
  yuksek: "border-l-slate-900 bg-slate-50/80",
  orta: "border-l-slate-300 bg-white",
};

function formatNet(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function KurumsalNetOzeti({
  sonTyTNet,
  sonAytNet,
}: {
  sonTyTNet?: number | null;
  sonAytNet?: number | null;
}) {
  const hasTyt = sonTyTNet != null && Number.isFinite(sonTyTNet);
  const hasAyt = sonAytNet != null && Number.isFinite(sonAytNet);
  const hasAny = hasTyt || hasAyt;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
        Kurumsal deneme netleri
      </p>
      {hasAny ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase text-slate-500">
              Son TYT net
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">
              {hasTyt ? formatNet(sonTyTNet) : "—"}
            </p>
            {!hasTyt ? (
              <p className="mt-0.5 text-[10px] text-slate-500">
                TYT denemesi kayıtlı değil
              </p>
            ) : null}
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase text-slate-500">
              Son AYT net
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">
              {hasAyt ? formatNet(sonAytNet) : "—"}
            </p>
            {!hasAyt ? (
              <p className="mt-0.5 text-[10px] text-slate-500">
                AYT denemesi kayıtlı değil
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          Henüz kurumsal deneme sonucu yok. Denemeler → Sonuç Yükleme ile ekleyin.
        </p>
      )}
    </div>
  );
}

function NetProgressBar({
  mevcut,
  hedef,
  label = "TYT net hedefi",
}: {
  mevcut: number | null | undefined;
  hedef: number;
  label?: string;
}) {
  const hasMevcut = mevcut != null && Number.isFinite(mevcut);

  if (!hasMevcut) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          TYT deneme netin henüz kayıtlı değil — ilerleme çubuğu gösterilmiyor.
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-800">
          Tahmini TYT hedefi: {formatNet(hedef)} net
        </p>
      </div>
    );
  }

  const progress =
    hedef > 0 ? Math.min(100, Math.round((mevcut / hedef) * 100)) : 0;
  const fark = Math.max(0, hedef - mevcut);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {formatNet(mevcut)}
            <span className="mx-1 text-lg font-medium text-slate-400">→</span>
            {formatNet(hedef)}
            <span className="ml-1 text-sm font-semibold text-slate-500">net</span>
          </p>
        </div>
        {fark > 0 ? (
          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
            +{fark} net gerekli
          </div>
        ) : (
          <div className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
            Hedefte
          </div>
        )}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-[11px] font-medium text-slate-500">
        %{progress} tamamlandı
      </p>
    </div>
  );
}

export function StrategyResponseCard({ data, studentId, className }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const hedef = data.hedefAnalizi;
  const gerceklik = hedef ? GERCEKCIK_LABEL[hedef.gerçekcilik] : null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addToProgram = useCallback(() => {
    if (!studentId) {
      appToast.warning("Onyx", "Öğrenci seçili değil.");
      return;
    }
    const picked = data.haftalikGorevler.filter((g) => selected.has(g.id));
    if (picked.length === 0) {
      appToast.info("Onyx", "En az bir görev seçin.");
      return;
    }
    const week = currentWeekMondayISO();
    const existing = loadWeeklyDraft(studentId, week)?.tasks ?? [];
    const newTasks: WeeklyTask[] = picked.map((g) => ({
      id: newTaskId(),
      dayIndex: Math.min(6, Math.max(0, g.gun ?? 0)),
      title: g.baslik,
      meta: [g.aciklama, g.sure].filter(Boolean).join(" · ") || "Onyx strateji",
      accent: "default",
      taskKind: "konu_calisma",
    }));
    saveWeeklyDraft(studentId, week, [...existing, ...newTasks]);
    appToast.success("Onyx", `${newTasks.length} görev haftalık programa eklendi.`);
    setSelected(new Set());
  }, [data.haftalikGorevler, selected, studentId]);

  const sortedTasks = useMemo(
    () =>
      [...data.haftalikGorevler].sort((a, b) => (a.gun ?? 0) - (b.gun ?? 0)),
    [data.haftalikGorevler]
  );

  const mevcutTyt =
    data.sonTyTNet != null && Number.isFinite(data.sonTyTNet)
      ? data.sonTyTNet
      : null;
  const hedefTyt = data.hedefTyTNet ?? data.hedefNet;
  const hasTytMevcut = mevcutTyt != null;

  return (
    <div
      className={cn(
        "w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
      data-onyx-skill="strategy"
    >
      <div className="border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Rocket className="h-5 w-5 text-amber-300" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Net & Strateji
            </p>
            <h4 className="mt-0.5 text-base font-bold">Kişisel net yol haritan</h4>
            {data.puanTipi ? (
              <span className="mt-2 inline-flex rounded-full bg-orange-500/25 px-2.5 py-0.5 text-xs font-bold text-orange-100 ring-1 ring-orange-400/30">
                {data.puanTipi} puan türü
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {data.ozet ? (
          <p className="text-sm leading-relaxed text-slate-700">{data.ozet}</p>
        ) : null}

        <KurumsalNetOzeti
          sonTyTNet={data.sonTyTNet}
          sonAytNet={data.sonAytNet}
        />

        <NetProgressBar mevcut={mevcutTyt} hedef={hedefTyt} />

        {hedef ? (
          <section className="overflow-hidden rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h5 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <GraduationCap className="h-4 w-4 text-slate-700" aria-hidden />
                Hedef bölüm — yerleştirme verisi
              </h5>
              {gerceklik ? (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1",
                    gerceklik.className
                  )}
                >
                  {gerceklik.label}
                </span>
              ) : null}
            </div>
            <div className="space-y-3 p-4">
              <div>
                <p className="font-semibold text-slate-900">
                  {hedef.program.universite}
                </p>
                <p className="text-sm text-slate-600">{hedef.program.bolum}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {hedef.program.basariSirasi ? (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-orange-800">
                      Başarı sırası
                    </p>
                    <p className="text-sm font-bold tabular-nums text-orange-950">
                      {hedef.program.basariSirasi}
                    </p>
                    <p className="mt-0.5 text-[10px] text-orange-700/80">
                      Yerleştirme sırası (net değil)
                    </p>
                  </div>
                ) : null}
                {hedef.program.tabanPuani ? (
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Taban puan
                    </p>
                    <p className="text-sm font-bold tabular-nums text-slate-900">
                      {hedef.program.tabanPuani}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Yerleştirme puanı (net değil)
                    </p>
                  </div>
                ) : null}
                <div className="rounded-lg bg-slate-900 px-3 py-2 text-white">
                  <p className="text-[10px] font-bold uppercase text-slate-300">
                    Net fark (TYT)
                  </p>
                  <p className="text-sm font-bold tabular-nums">
                    {hasTytMevcut
                      ? `+${Math.max(0, hedefTyt - mevcutTyt!)} net`
                      : "Hesaplanmadı"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {hasTytMevcut
                      ? `Tahmini TYT hedefi: ${formatNet(hedefTyt)} net`
                      : "TYT denemesi girilince net farkı hesaplanır"}
                  </p>
                </div>
              </div>
              {hedef.tahminiSure ? (
                <p className="text-xs font-medium text-slate-600">
                  Tahmini süre: {hedef.tahminiSure}
                </p>
              ) : null}
              <p className="text-sm leading-relaxed text-slate-700">
                {hedef.analiz}
              </p>
              {hedef.program.atlasKaynak ? (
                <p className="text-[11px] font-medium text-slate-500">
                  Kaynak: YÖK Atlas (DerecePanel)
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {data.bransAnalizi && data.bransAnalizi.length > 0 ? (
          <section>
            <h5 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <TrendingUp className="h-4 w-4 text-orange-500" aria-hidden />
              Branş öncelikleri
            </h5>
            <ul className="space-y-2">
              {data.bransAnalizi.map((b, i) => (
                <li
                  key={`brans-${i}`}
                  className={cn(
                    "rounded-lg border border-slate-200 border-l-4 px-3 py-2.5",
                    ONCELIK_CLASS[b.oncelik]
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {b.ders}
                    </span>
                    {b.hedefNet != null ? (
                      <span className="text-xs font-bold text-slate-600">
                        hedef {b.hedefNet} net
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {b.gerekce}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {data.oncelikliKonular && data.oncelikliKonular.length > 0 ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4">
            <h5 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
              <BookOpen className="h-4 w-4 text-slate-700" aria-hidden />
              Bu hafta öncelikli konular
            </h5>
            <div className="flex flex-wrap gap-2">
              {data.oncelikliKonular.map((k, i) => (
                <span
                  key={`konu-${i}`}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200"
                >
                  {k}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h5 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
            <CalendarDays className="h-4 w-4 text-slate-700" aria-hidden />
            Haftalık görevler
          </h5>
          <ul className="space-y-2">
            {sortedTasks.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
                Bu hafta için görev önerisi üretilemedi.
              </li>
            ) : (
              sortedTasks.map((g) => (
                <li key={g.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-slate-300",
                      g.oncelik === "kritik" && "border-orange-200 bg-orange-50/30"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                      checked={selected.has(g.id)}
                      onChange={() => toggle(g.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {g.baslik}
                        </span>
                        {g.gun != null ? (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                            {GUN_LABELS[g.gun] ?? `G${g.gun}`}
                          </span>
                        ) : null}
                        {g.sure ? (
                          <span className="text-[10px] font-medium text-slate-500">
                            {g.sure}
                          </span>
                        ) : null}
                      </span>
                      {g.aciklama ? (
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">
                          {g.aciklama}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))
            )}
          </ul>
        </section>

        {data.koçNotu ? (
          <blockquote className="flex gap-2.5 rounded-xl border-l-4 border-slate-900 bg-slate-50 px-4 py-3 text-sm italic leading-relaxed text-slate-800">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden />
            {data.koçNotu}
          </blockquote>
        ) : null}

        <Button variant="primary" type="button" onClick={addToProgram} className="w-full sm:w-auto">
          <ArrowUpRight className="mr-1.5 h-4 w-4" aria-hidden />
          Seçili Görevleri Haftalık Programa Ekle
        </Button>
      </div>
    </div>
  );
}
