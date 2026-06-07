"use client";

import { useState, type ReactNode } from "react";
import { AlertCircle, LayoutTemplate, Palette, SlidersHorizontal } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEMPLATE_OPTIONS } from "@/lib/pazarlama/constants";
import { formatTrDate } from "@/lib/pazarlama/utils";
import type { CountdownCustomState, StoryKind, TextState } from "@/lib/pazarlama/types";
import type { MergedExam } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

import { BrandPanel } from "./brand-panel";
import { ExportPanel } from "./export-panel";

type TabId = "data" | "brand" | "export";

const TABS: { id: TabId; label: string; icon: typeof LayoutTemplate }[] = [
  { id: "data", label: "Şablon & Veri", icon: LayoutTemplate },
  { id: "brand", label: "Marka", icon: Palette },
  { id: "export", label: "Dışa Aktar", icon: SlidersHorizontal },
];

const PANEL_CLASS =
  "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm";

type Props = {
  exams: MergedExam[];
  kind: StoryKind;
  style: string;
  styleOptions: { value: string; label: string }[];
  examId: string;
  meta: { count: string; top: string };
  brand: import("@/lib/pazarlama/types").BrandState;
  textState: TextState;
  customState: CountdownCustomState;
  missingExam: boolean;
  onKindChange: (k: StoryKind) => void;
  onStyleChange: (s: string) => void;
  onExamChange: (id: string) => void;
  onTextChange: (section: keyof TextState, patch: Partial<TextState[keyof TextState]>) => void;
  onCustomChange: (patch: Partial<CountdownCustomState>) => void;
  onApplyPalette: (id: string) => void;
  onAccentChange: (accent: string) => void;
  onLogoChange: (url: string) => void;
  onClearLogo: () => void;
  onRefresh: () => void;
  onFit: () => void;
};

export function ControlPanel(props: Props) {
  const [tab, setTab] = useState<TabId>("data");
  const showExam = props.kind !== "countdown";

  return (
    <section className={PANEL_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Ayarlar</h2>
          <p className="mt-0.5 text-xs text-slate-500">Şablon, metinler ve marka</p>
        </div>
        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600">
          1080×1920
        </span>
      </div>

      <div
        className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
        role="tablist"
        aria-label="Ayar sekmeleri"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-2 py-2 text-center text-[11px] font-semibold transition-colors sm:flex-row sm:justify-center sm:gap-1.5 sm:py-2.5 sm:text-xs",
                selected
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
              onClick={() => setTab(t.id)}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              <span className="leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {tab === "data" && (
          <div id="pm-panel-data" className="grid gap-4" role="tabpanel">
            {props.missingExam && (
              <div
                className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950"
                role="status"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  Önizleme için bir deneme seçin. Sonuç yüklenmemiş denemelerde tablo boş
                  görünür.
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="pm-template-select">Şablon</Label>
              <Select
                value={props.kind}
                onValueChange={(v) => props.onKindChange(v as StoryKind)}
              >
                <SelectTrigger id="pm-template-select" className="w-full">
                  <SelectValue placeholder="Şablon seçin" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pm-template-style">Şablon stili</Label>
              <Select value={props.style} onValueChange={props.onStyleChange}>
                <SelectTrigger id="pm-template-style" className="w-full">
                  <SelectValue placeholder="Stil seçin" />
                </SelectTrigger>
                <SelectContent>
                  {props.styleOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showExam && (
              <div id="pm-exam-field" className="grid gap-2">
                <Label htmlFor="pm-exam-select">Deneme verisi</Label>
                <Select
                  value={props.examId || "__none__"}
                  onValueChange={(v) => props.onExamChange(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="pm-exam-select" className="w-full">
                    <SelectValue placeholder="Deneme seçin…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Deneme seçin…</SelectItem>
                    {props.exams.map((ex) => {
                      const dt = ex.tarih || ex.date || "";
                      const meta = dt ? ` · ${formatTrDate(dt)}` : "";
                      return (
                        <SelectItem key={ex.id} value={ex.id}>
                          {(ex.name || ex.ad || ex.id) + meta}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {!props.exams.length && (
                  <p className="text-xs text-amber-700">
                    Henüz deneme yok — önce takvime deneme ekleyin.
                  </p>
                )}
              </div>
            )}

            <CustomTextFields
              kind={props.kind}
              textState={props.textState}
              customState={props.customState}
              onTextChange={props.onTextChange}
              onCustomChange={props.onCustomChange}
            />

            {props.kind === "leaderboard" && (
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <div>
                  <p className="text-[11px] font-medium text-slate-500">Kayıt</p>
                  <p className="text-lg font-semibold text-slate-900" id="pm-meta-count">
                    {props.meta.count}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">İlk 10</p>
                  <p className="text-lg font-semibold text-slate-900" id="pm-meta-top">
                    {props.meta.top}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "brand" && (
          <div id="pm-panel-brand" role="tabpanel">
            <BrandPanel
              brand={props.brand}
              onApplyPalette={props.onApplyPalette}
              onAccentChange={props.onAccentChange}
              onLogoChange={props.onLogoChange}
              onClearLogo={props.onClearLogo}
            />
          </div>
        )}

        {tab === "export" && (
          <div id="pm-panel-export" role="tabpanel">
            <ExportPanel onFit={props.onFit} onRefresh={props.onRefresh} />
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function CustomTextFields({
  kind,
  textState,
  customState,
  onTextChange,
  onCustomChange,
}: {
  kind: StoryKind;
  textState: TextState;
  customState: CountdownCustomState;
  onTextChange: Props["onTextChange"];
  onCustomChange: Props["onCustomChange"];
}) {
  const inputClass =
    "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1";

  if (kind === "leaderboard") {
    const lb = textState.leaderboard;
    const fields: { id: string; label: string; value: string; onChange: (v: string) => void }[] = [
      { id: "pm-lb-title", label: "Story başlık", value: lb.title, onChange: (v) => onTextChange("leaderboard", { title: v }) },
      { id: "pm-lb-badge", label: "Rozet", value: lb.badge, onChange: (v) => onTextChange("leaderboard", { badge: v }) },
      { id: "pm-lb-board", label: "Tablo başlığı", value: lb.boardTitle, onChange: (v) => onTextChange("leaderboard", { boardTitle: v }) },
      { id: "pm-lb-metric", label: "Metrik etiketi", value: lb.metric, onChange: (v) => onTextChange("leaderboard", { metric: v }) },
      { id: "pm-lb-foot", label: "Alt sağ etiket", value: lb.footRight, onChange: (v) => onTextChange("leaderboard", { footRight: v }) },
    ];
    return (
      <div id="pm-custom-fields" className="grid gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metinler</p>
        {fields.map((f) => (
          <Field key={f.id} label={f.label} htmlFor={f.id}>
            <input
              id={f.id}
              className={inputClass}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
            />
          </Field>
        ))}
      </div>
    );
  }

  if (kind === "star") {
    const st = textState.star;
    const fields: { id: string; label: string; value: string; onChange: (v: string) => void }[] = [
      { id: "pm-st-badge", label: "Rozet", value: st.badge, onChange: (v) => onTextChange("star", { badge: v }) },
      { id: "pm-st-title", label: "Başlık", value: st.title, onChange: (v) => onTextChange("star", { title: v }) },
      { id: "pm-st-sub", label: "Alt yazı", value: st.sub, onChange: (v) => onTextChange("star", { sub: v }) },
      { id: "pm-st-kicker", label: "Kicker (önceki sınav varsa)", value: st.kickerBase, onChange: (v) => onTextChange("star", { kickerBase: v }) },
      { id: "pm-st-kicker-empty", label: "Kicker (önceki sınav yoksa)", value: st.kickerEmpty, onChange: (v) => onTextChange("star", { kickerEmpty: v }) },
    ];
    return (
      <div id="pm-custom-fields" className="grid gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metinler</p>
        {fields.map((f) => (
          <Field key={f.id} label={f.label} htmlFor={f.id}>
            <input
              id={f.id}
              className={inputClass}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
            />
          </Field>
        ))}
      </div>
    );
  }

  const ct = textState.countdown;
  return (
    <div id="pm-custom-fields" className="grid gap-3 border-t border-slate-100 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Geri sayım</p>
      <Field label="Hedef tarih" htmlFor="pm-countdown-date">
        <input
          type="date"
          id="pm-countdown-date"
          className={inputClass}
          value={customState.targetDate}
          onChange={(e) => onCustomChange({ targetDate: e.target.value })}
        />
      </Field>
      <Field label="Başlık" htmlFor="pm-countdown-headline">
        <input
          id="pm-countdown-headline"
          className={inputClass}
          value={customState.headline}
          onChange={(e) => onCustomChange({ headline: e.target.value })}
        />
      </Field>
      <Field label="Alt mesaj" htmlFor="pm-countdown-submsg">
        <textarea
          id="pm-countdown-submsg"
          rows={2}
          className={cn(inputClass, "h-auto min-h-[4rem] py-2")}
          value={customState.subMsg}
          onChange={(e) => onCustomChange({ subMsg: e.target.value })}
        />
      </Field>
      <Field label="Motivasyon metni" htmlFor="pm-countdown-quote-input">
        <textarea
          id="pm-countdown-quote-input"
          rows={3}
          className={cn(inputClass, "h-auto min-h-[4.5rem] py-2")}
          value={customState.quote}
          onChange={(e) => onCustomChange({ quote: e.target.value })}
        />
      </Field>
      <Field label="Progress bar bazı (gün)" htmlFor="pm-countdown-total">
        <input
          type="number"
          min={1}
          id="pm-countdown-total"
          className={inputClass}
          value={customState.totalDays}
          onChange={(e) => onCustomChange({ totalDays: Number(e.target.value) })}
        />
      </Field>
      <Field label="Rozet" htmlFor="pm-text-cd-badge">
        <input
          id="pm-text-cd-badge"
          className={inputClass}
          value={ct.badge}
          onChange={(e) => onTextChange("countdown", { badge: e.target.value })}
        />
      </Field>
      <Field label="Alt sol etiket" htmlFor="pm-text-cd-foot">
        <input
          id="pm-text-cd-foot"
          className={inputClass}
          value={ct.footLeft}
          onChange={(e) => onTextChange("countdown", { footLeft: e.target.value })}
        />
      </Field>
    </div>
  );
}
