"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Layers, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { QuestionPoolItem } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

import "@/styles/havuz-studio.css";

type HavuzModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pool: QuestionPoolItem[];
  onConfirm: (items: QuestionPoolItem[]) => void;
};

type AnswerFilter = "all" | "marked" | "unmarked" | "A" | "B" | "C" | "D" | "E";

export function HavuzModal({ open, onOpenChange, pool, onConfirm }: HavuzModalProps) {
  const [search, setSearch] = useState("");
  const [ders, setDers] = useState("");
  const [konu, setKonu] = useState("");
  const [answerFilter, setAnswerFilter] = useState<AnswerFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDers("");
      setKonu("");
      setAnswerFilter("all");
      setSelected(new Set());
    }
  }, [open]);

  const dersler = useMemo(
    () => [...new Set(pool.map((p) => p.ders).filter(Boolean))].sort(),
    [pool]
  );

  const konular = useMemo(() => {
    const src = ders ? pool.filter((p) => p.ders === ders) : pool;
    return [...new Set(src.map((p) => p.konu).filter(Boolean))].sort();
  }, [pool, ders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pool.filter((item) => {
      if (ders && item.ders !== ders) return false;
      if (konu && item.konu !== konu) return false;
      if (answerFilter === "marked" && !item.answer) return false;
      if (answerFilter === "unmarked" && item.answer) return false;
      if (["A", "B", "C", "D", "E"].includes(answerFilter) && item.answer !== answerFilter)
        return false;
      if (!q) return true;
      return (
        item.kavram.toLowerCase().includes(q) ||
        item.konu.toLowerCase().includes(q) ||
        item.ders.toLowerCase().includes(q)
      );
    });
  }, [pool, ders, konu, search, answerFilter]);

  const toggle = (uuid: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(uuid)) n.delete(uuid);
      else n.add(uuid);
      return n;
    });
  };

  const selectAllFiltered = () => {
    setSelected(new Set(filtered.map((f) => f.uuid)));
  };

  const clearSelection = () => setSelected(new Set());

  const resetFilters = () => {
    setSearch("");
    setDers("");
    setKonu("");
    setAnswerFilter("all");
  };

  const hasActiveFilters = Boolean(search.trim() || ders || konu || answerFilter !== "all");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="tm-havuz-modal"
        className="!flex max-h-[min(92vh,880px)] min-h-[min(72vh,640px)] w-[min(96vw,1200px)] max-w-[min(96vw,1200px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1200px)]"
      >
        <DialogHeader className="shrink-0 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-6 py-4 text-left">
          <DialogTitle className="text-lg font-extrabold tracking-tight text-slate-900">
            Soru havuzundan seç
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Sol panelden filtreleyin, sağdan soruları işaretleyip teste ekleyin.
          </DialogDescription>
        </DialogHeader>

        <div className="havuz-studio__body havuz-studio__body--modal min-h-[min(60vh,560px)] flex-1 rounded-none border-0 border-t border-slate-200 shadow-none">
          <aside className="havuz-filters w-[240px] shrink-0" aria-label="Havuz filtreleri">
            <div className="havuz-filters__head">
              <h2 className="text-sm font-bold text-slate-900">Filtreler</h2>
              <p className="text-xs text-slate-500">
                {pool.length} soru · {filtered.length} eşleşen
              </p>
            </div>
            <div className="havuz-filters__scroll">
              <label className="havuz-field">
                <span className="havuz-field__label">Ara</span>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <Input
                    className="h-9 rounded-lg pl-8 text-sm"
                    placeholder="Ders, konu, kavram…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </label>

              <label className="havuz-field">
                <span className="havuz-field__label">Ders</span>
                <select
                  className="havuz-field__input"
                  value={ders}
                  onChange={(e) => {
                    setDers(e.target.value);
                    setKonu("");
                  }}
                >
                  <option value="">Tüm dersler</option>
                  {dersler.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <label className="havuz-field">
                <span className="havuz-field__label">Konu</span>
                <select
                  className="havuz-field__input"
                  value={konu}
                  onChange={(e) => setKonu(e.target.value)}
                  disabled={!konular.length}
                >
                  <option value="">Tüm konular</option>
                  {konular.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </label>

              <label className="havuz-field">
                <span className="havuz-field__label">Cevap anahtarı</span>
                <select
                  className="havuz-field__input"
                  value={answerFilter}
                  onChange={(e) => setAnswerFilter(e.target.value as AnswerFilter)}
                >
                  <option value="all">Tüm cevaplar</option>
                  <option value="marked">İşaretli</option>
                  <option value="unmarked">İşaretsiz</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
              </label>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 w-full rounded-lg text-xs"
                  onClick={resetFilters}
                >
                  <X className="mr-1 h-3.5 w-3.5" aria-hidden />
                  Filtreleri temizle
                </Button>
              )}

              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Seçim</p>
                <p className="mt-1">
                  <span className="font-bold text-slate-900">{selected.size}</span> soru seçili
                </p>
                <div className="mt-2 flex flex-col gap-1.5">
                  <button
                    type="button"
                    className="text-left text-xs font-medium text-slate-700 underline-offset-2 hover:underline disabled:opacity-40"
                    disabled={!filtered.length}
                    onClick={selectAllFiltered}
                  >
                    Görünenleri seç ({filtered.length})
                  </button>
                  <button
                    type="button"
                    className="text-left text-xs font-medium text-slate-500 underline-offset-2 hover:underline disabled:opacity-40"
                    disabled={!selected.size}
                    onClick={clearSelection}
                  >
                    Seçimi temizle
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <section className="havuz-pool min-w-0 flex-1" aria-label="Soru listesi">
            <div className="havuz-pool__toolbar">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Layers className="h-4 w-4 text-slate-400" aria-hidden />
                <span>
                  <strong className="text-slate-900">{filtered.length}</strong> soru listeleniyor
                </span>
              </div>
              {selected.size > 0 && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {selected.size} seçili
                </span>
              )}
            </div>

            <div className="havuz-pool__scroll">
              {filtered.length === 0 ? (
                <div className="havuz-pool__empty">
                  <p className="text-sm font-semibold text-slate-800">Eşleşen soru yok</p>
                  <p className="max-w-sm text-xs text-slate-500">
                    Filtreleri genişletin veya havuza yeni soru ekleyin.
                  </p>
                  {hasActiveFilters && (
                    <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                      Filtreleri temizle
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="havuz-pool__grid">
                  {filtered.map((item) => {
                    const isSel = selected.has(item.uuid);
                    return (
                      <li key={item.uuid}>
                        <button
                          type="button"
                          onClick={() => toggle(item.uuid)}
                          className={cn(
                            "group relative w-full overflow-hidden rounded-xl border bg-white text-left shadow-sm transition",
                            isSel
                              ? "border-slate-900 ring-2 ring-slate-900/15"
                              : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.dataUrl}
                            alt=""
                            className="aspect-[4/3] w-full bg-slate-50 object-contain"
                          />
                          <div className="border-t border-slate-100 px-2.5 py-2">
                            <p className="truncate text-xs font-semibold text-slate-800">
                              {item.ders}
                            </p>
                            <p className="truncate text-[10px] text-slate-500">
                              {item.konu}
                              {item.kavram ? ` · ${item.kavram}` : ""}
                            </p>
                            {item.answer && (
                              <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                Cevap: {item.answer}
                              </span>
                            )}
                          </div>
                          {isSel && (
                            <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-md">
                              <Check className="h-4 w-4" aria-hidden />
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          <Button
            variant="primary"
            disabled={selected.size === 0}
            onClick={() => {
              onConfirm(pool.filter((p) => selected.has(p.uuid)));
              onOpenChange(false);
            }}
          >
            {selected.size > 0 ? `${selected.size} soruyu ekle` : "Soru seçin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
