"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Filter, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bursDisplayLabel, normPuanTip } from "@/lib/yks-sim/atlas-enrich";
import type { BolumDili } from "@/lib/yks-sim/atlas-program-display";
import {
  isPuanTypeSelected,
  togglePuanTypeSelection,
} from "@/lib/yks-sim/tercih-defaults";
import { bolumDiliLabel } from "@/lib/yks-sim/atlas-program-display";
import { cn } from "@/lib/utils";

const BURS_OPTIONS = ["Burslu", "%50 Burslu", "%25 Burslu", "Burssuz"] as const;

export type TercihFilterState = {
  year: string;
  puanTipleri: string[];
  sehirler: string[];
  universiteler: string[];
  bolumler: string[];
  bsMin: string;
  bsMax: string;
  kurum: string;
  ogrenim: string;
  burs: string[];
  bolumDili: BolumDili[];
  depremKontenjan: "" | "var" | "yok";
};

const BOLUM_DILI_OPTIONS: { value: BolumDili; label: string }[] = [
  { value: "turkce", label: "Türkçe" },
  { value: "ingilizce", label: "İngilizce" },
  { value: "yabanci", label: "Yabancı dil (Almanca vb.)" },
];

type PickerProps = {
  label: string;
  options: string[];
  selected: string[];
  onApply: (next: string[]) => void;
  emptyHint?: string;
};

function groupOptionsByLetter(list: string[]): { letter: string; items: string[] }[] {
  const map = new Map<string, string[]>();
  for (const item of list) {
    const letter = item.trim().charAt(0).toLocaleUpperCase("tr-TR") || "#";
    const bucket = map.get(letter) ?? [];
    bucket.push(item);
    map.set(letter, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "tr-TR"))
    .map(([letter, items]) => ({
      letter,
      items: items.sort((x, y) => x.localeCompare(y, "tr-TR")),
    }));
}

/** Şehir / üniversite — modal yok; tetikleyicinin altında arama + kaydırılabilir liste */
export function InlineFilterPicker({
  label,
  options,
  selected,
  onApply,
  emptyHint = "Liste yükleniyor…",
  isOpen,
  onToggle,
}: PickerProps & { isOpen: boolean; onToggle: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setQ("");
      return;
    }
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onToggle]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr-TR");
    const list = needle
      ? options.filter((o) => o.toLocaleLowerCase("tr-TR").includes(needle))
      : options;
    return [...list].sort((a, b) => a.localeCompare(b, "tr-TR"));
  }, [options, q]);

  const grouped = useMemo(() => groupOptionsByLetter(filtered), [filtered]);

  const summary =
    selected.length === 0
      ? "Tümü"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} seçili`;

  const toggle = (val: string) => {
    onApply(
      selected.includes(val) ? selected.filter((x) => x !== val) : [...selected, val]
    );
  };

  const selectVisible = () => {
    onApply([...new Set([...selected, ...filtered])]);
  };

  const clearAll = () => onApply([]);

  const renderRow = (opt: string) => {
    const on = selected.includes(opt);
    return (
      <button
        key={opt}
        type="button"
        role="option"
        aria-selected={on}
        onClick={() => toggle(opt)}
        className={cn(
          "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
          on ? "bg-slate-900/5 ring-1 ring-slate-900/10" : "hover:bg-slate-50"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"
          )}
        >
          {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
        <span className="min-w-0 flex-1 text-sm leading-snug text-slate-800">{opt}</span>
      </button>
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-slate-300",
          isOpen || selected.length > 0
            ? "border-slate-900/30 ring-1 ring-slate-900/10"
            : "border-slate-200"
        )}
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {label}
          </span>
          <span className="block truncate font-medium text-slate-800">{summary}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className="mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5"
          role="listbox"
          aria-label={`${label} seçenekleri`}
          aria-multiselectable
        >
          <div className="border-b border-slate-100 bg-slate-50/80 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                ref={searchRef}
                placeholder={`${label} ara…`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-9 bg-white pl-9 text-sm"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[11px]"
                onClick={selectVisible}
                disabled={filtered.length === 0}
              >
                Görünenleri seç ({filtered.length})
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px]"
                onClick={clearAll}
                disabled={selected.length === 0}
              >
                Temizle
              </Button>
            </div>
          </div>

          <div className="max-h-[min(52vh,320px)] overflow-y-auto overscroll-contain p-1.5">
            {filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">{emptyHint}</p>
            ) : q.trim() ? (
              <div className="space-y-0.5">{filtered.map(renderRow)}</div>
            ) : (
              <div className="space-y-3">
                {grouped.map(({ letter, items }) => (
                  <div key={letter}>
                    <p className="sticky top-0 z-[1] bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-sm">
                      {letter}
                    </p>
                    <div className="space-y-0.5">{items.map(renderRow)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-500">
            <span>
              {filtered.length} sonuç
              {q.trim() ? ` · “${q.trim()}”` : ""}
            </span>
            <span className="font-semibold text-slate-700">{selected.length} seçili</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterPickerDialog({
  label,
  options,
  selected,
  onApply,
  emptyHint = "Liste yükleniyor…",
}: PickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr-TR");
    const list = needle
      ? options.filter((o) => o.toLocaleLowerCase("tr-TR").includes(needle))
      : options;
    return list.slice(0, 300);
  }, [options, q]);

  const openDialog = (next: boolean) => {
    if (next) {
      setDraft(selected);
      setQ("");
    }
    setOpen(next);
  };

  const toggle = (val: string) => {
    setDraft((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
    );
  };

  const summary =
    selected.length === 0
      ? "Tümü"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} seçili`;

  return (
    <Dialog open={open} onOpenChange={openDialog}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-slate-300",
            selected.length > 0
              ? "border-slate-900/30 ring-1 ring-slate-900/10"
              : "border-slate-200"
          )}
        >
          <span className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {label}
            </span>
            <span className="block truncate font-medium text-slate-800">{summary}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-slate-100 px-5 py-4">
          <DialogTitle>{label} seç</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={`${label} ara…`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setDraft([...filtered])}
            >
              Görünenleri seç
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setDraft([])}
            >
              Temizle
            </Button>
          </div>
          <div className="max-h-[min(50vh,360px)] space-y-0.5 overflow-y-auto rounded-lg border border-slate-100 p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">{emptyHint}</p>
            ) : (
              filtered.map((opt) => (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-slate-50"
                >
                  <Checkbox
                    checked={draft.includes(opt)}
                    onCheckedChange={() => toggle(opt)}
                  />
                  <span className="text-sm text-slate-800">{opt}</span>
                </label>
              ))
            )}
          </div>
        </div>
        <DialogFooter className="border-t border-slate-100 px-5 py-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Uygula ({draft.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SegmentedYears({
  years,
  value,
  onChange,
}: {
  years: readonly string[];
  value: string;
  onChange: (y: string) => void;
}) {
  return (
    <div className="flex rounded-xl bg-slate-100 p-1">
      {years.map((y) => (
        <button
          key={y}
          type="button"
          onClick={() => onChange(y)}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-semibold transition-all",
            value === y
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {y}
        </button>
      ))}
    </div>
  );
}

function PuanChips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (p: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((p) => {
        const on = isPuanTypeSelected(selected, p);
        return (
          <button
            key={p}
            type="button"
            onClick={() => onToggle(p)}
            aria-pressed={on}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
              on
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}

type SidebarProps = {
  filters: TercihFilterState;
  cities: string[];
  universities: string[];
  bolumler: string[];
  puanTipleri: string[];
  years: readonly string[];
  onChange: (patch: Partial<TercihFilterState>) => void;
  onReset: () => void;
};

export function TercihFilterSidebar({
  filters,
  cities,
  universities,
  bolumler,
  puanTipleri,
  years,
  onChange,
  onReset,
}: SidebarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [openPicker, setOpenPicker] = useState<"sehir" | "universite" | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openPicker) return;
    const onPointerDown = (e: MouseEvent) => {
      const el = sidebarRef.current;
      if (!el?.contains(e.target as Node)) setOpenPicker(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openPicker]);

  const togglePuan = (p: string) => {
    onChange({ puanTipleri: togglePuanTypeSelection(filters.puanTipleri, p) });
  };

  const toggleBurs = (b: string) => {
    const next = filters.burs.includes(b)
      ? filters.burs.filter((x) => x !== b)
      : [...filters.burs, b];
    onChange({ burs: next });
  };

  const toggleBolumDili = (d: BolumDili) => {
    const next = filters.bolumDili.includes(d)
      ? filters.bolumDili.filter((x) => x !== d)
      : [...filters.bolumDili, d];
    onChange({ bolumDili: next });
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Filter className="h-4 w-4" />
          Filtreler
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onReset}>
          Sıfırla
        </Button>
      </div>

      <div
        ref={sidebarRef}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
      >
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Tablo yılı
          </p>
          <SegmentedYears
            years={years}
            value={filters.year}
            onChange={(year) => onChange({ year })}
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Puan tipi
          </p>
          <PuanChips options={puanTipleri} selected={filters.puanTipleri} onToggle={togglePuan} />
        </div>

        <div className="space-y-2">
          <InlineFilterPicker
            label="Şehir"
            options={cities}
            selected={filters.sehirler}
            onApply={(sehirler) => onChange({ sehirler })}
            emptyHint="Şehir listesi yükleniyor…"
            isOpen={openPicker === "sehir"}
            onToggle={() =>
              setOpenPicker((prev) => (prev === "sehir" ? null : "sehir"))
            }
          />
          <InlineFilterPicker
            label="Üniversite"
            options={universities}
            selected={filters.universiteler}
            onApply={(universiteler) => onChange({ universiteler })}
            emptyHint="Üniversite listesi yükleniyor…"
            isOpen={openPicker === "universite"}
            onToggle={() =>
              setOpenPicker((prev) => (prev === "universite" ? null : "universite"))
            }
          />
          <FilterPickerDialog
            label="Bölüm"
            options={bolumler}
            selected={filters.bolumler}
            onApply={(bolumler) => onChange({ bolumler })}
            emptyHint="Bölüm listesi yükleniyor…"
          />
        </div>

        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-slate-700"
        >
          Gelişmiş filtreler
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")}
          />
        </button>

        {advancedOpen && (
          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">Başarı sırası</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Min"
                  value={filters.bsMin}
                  onChange={(e) => onChange({ bsMin: e.target.value })}
                  className="h-9"
                />
                <Input
                  placeholder="Max"
                  value={filters.bsMax}
                  onChange={(e) => onChange({ bsMax: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
            <Select
              value={filters.kurum || "all"}
              onValueChange={(v) => onChange({ kurum: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Kurum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm kurumlar</SelectItem>
                <SelectItem value="devlet">Devlet</SelectItem>
                <SelectItem value="vakif">Vakıf</SelectItem>
                <SelectItem value="kktc">KKTC</SelectItem>
                <SelectItem value="yurtdisi">Yurtdışı</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.ogrenim || "all"}
              onValueChange={(v) => onChange({ ogrenim: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Öğrenim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm öğrenim</SelectItem>
                <SelectItem value="orgun">Örgün</SelectItem>
                <SelectItem value="ikinci">İkinci öğretim</SelectItem>
                <SelectItem value="acik">Açıköğretim</SelectItem>
                <SelectItem value="uzaktan">Uzaktan</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <p className="mb-2 text-[11px] font-semibold text-slate-500">Bölüm dili</p>
              <div className="flex flex-wrap gap-2">
                {BOLUM_DILI_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      filters.bolumDili.includes(value)
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <Checkbox
                      className="sr-only"
                      checked={filters.bolumDili.includes(value)}
                      onCheckedChange={() => toggleBolumDili(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <Select
              value={filters.depremKontenjan || "all"}
              onValueChange={(v) =>
                onChange({
                  depremKontenjan: v === "all" ? "" : (v as "var" | "yok"),
                })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Depremzede kontenjanı" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Deprem kontenjanı — tümü</SelectItem>
                <SelectItem value="var">Depremzede kontenjanı var</SelectItem>
                <SelectItem value="yok">Depremzede kontenjanı yok</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <p className="mb-2 text-[11px] font-semibold text-slate-500">Burs</p>
              <div className="flex flex-wrap gap-2">
                {BURS_OPTIONS.map((b) => (
                  <label
                    key={b}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      filters.burs.includes(b)
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <Checkbox
                      className="sr-only"
                      checked={filters.burs.includes(b)}
                      onCheckedChange={() => toggleBurs(b)}
                    />
                    {bursDisplayLabel(b)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export function buildTercihPrintFilterSummary(filters: TercihFilterState): string {
  const parts: string[] = [];
  parts.push(`Yıl: ${filters.year}`);
  parts.push(
    filters.puanTipleri.length ? `Puan: ${filters.puanTipleri.join(", ")}` : "Puan: —"
  );
  if (filters.sehirler.length) parts.push(`Şehir: ${filters.sehirler.join(" · ")}`);
  if (filters.universiteler.length) {
    const u = filters.universiteler;
    parts.push(
      `Üni: ${u.slice(0, 3).join(" · ")}${u.length > 3 ? ` (+${u.length - 3})` : ""}`
    );
  }
  if (filters.bolumler.length) {
    const b = filters.bolumler;
    parts.push(
      `Bölüm: ${b.slice(0, 2).join(" · ")}${b.length > 2 ? ` (+${b.length - 2})` : ""}`
    );
  }
  if (filters.bsMin || filters.bsMax) {
    parts.push(`Sıra: ${filters.bsMin || "—"} – ${filters.bsMax || "—"}`);
  }
  if (filters.kurum) parts.push(`Kurum: ${filters.kurum}`);
  if (filters.ogrenim) parts.push(`Öğrenim: ${filters.ogrenim}`);
  if (filters.burs.length) parts.push(`Burs: ${filters.burs.join(", ")}`);
  if (filters.bolumDili.length) parts.push(`Program dili: ${filters.bolumDili.join(", ")}`);
  if (filters.depremKontenjan) parts.push(`Deprem k.: ${filters.depremKontenjan}`);
  return parts.join("  ·  ");
}

export function ActiveFilterChips({
  filters,
  onChange,
  onClearAll,
}: {
  filters: TercihFilterState;
  onChange: (patch: Partial<TercihFilterState>) => void;
  onClearAll: () => void;
}) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  filters.sehirler.forEach((s) =>
    chips.push({
      key: `sehir-${s}`,
      label: s,
      clear: () => onChange({ sehirler: filters.sehirler.filter((x) => x !== s) }),
    })
  );
  filters.universiteler.forEach((u) =>
    chips.push({
      key: `uni-${u}`,
      label: u,
      clear: () => onChange({ universiteler: filters.universiteler.filter((x) => x !== u) }),
    })
  );
  filters.bolumler.forEach((b) =>
    chips.push({
      key: `bol-${b}`,
      label: b,
      clear: () => onChange({ bolumler: filters.bolumler.filter((x) => x !== b) }),
    })
  );
  if (filters.bsMin || filters.bsMax) {
    chips.push({
      key: "bs",
      label: `Sıra ${filters.bsMin || "…"} – ${filters.bsMax || "…"}`,
      clear: () => onChange({ bsMin: "", bsMax: "" }),
    });
  }
  if (filters.kurum) {
    chips.push({
      key: "kurum",
      label: filters.kurum,
      clear: () => onChange({ kurum: "" }),
    });
  }
  if (filters.ogrenim) {
    chips.push({
      key: "ogrenim",
      label: filters.ogrenim,
      clear: () => onChange({ ogrenim: "" }),
    });
  }
  filters.burs.forEach((b) =>
    chips.push({
      key: `burs-${b}`,
      label: bursDisplayLabel(b),
      clear: () => onChange({ burs: filters.burs.filter((x) => x !== b) }),
    })
  );
  filters.bolumDili.forEach((d) =>
    chips.push({
      key: `dil-${d}`,
      label: bolumDiliLabel(d),
      clear: () => onChange({ bolumDili: filters.bolumDili.filter((x) => x !== d) }),
    })
  );
  if (filters.depremKontenjan === "var") {
    chips.push({
      key: "deprem-var",
      label: "Deprem kontenjanı var",
      clear: () => onChange({ depremKontenjan: "" }),
    });
  }
  if (filters.depremKontenjan === "yok") {
    chips.push({
      key: "deprem-yok",
      label: "Deprem kontenjanı yok",
      clear: () => onChange({ depremKontenjan: "" }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.clear}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          {c.label}
          <X className="h-3 w-3 opacity-60" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        Tümünü kaldır
      </button>
    </div>
  );
}

export function puanTipBadgeClass(pt: string): string {
  const n = normPuanTip(pt);
  if (n === "SAY") return "bg-blue-100 text-blue-900";
  if (n === "EA") return "bg-violet-100 text-violet-900";
  if (n === "SOZ") return "bg-teal-100 text-teal-900";
  if (n === "DIL") return "bg-amber-100 text-amber-900";
  if (n === "TYT") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-700";
}
