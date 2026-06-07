"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, Target } from "lucide-react";
import { toast } from "@/lib/notify";

import {
  ActiveFilterChips,
  TercihFilterSidebar,
  type TercihFilterState,
} from "@/components/yks-sim/tercih-sihirbazi-filters";
import { TercihPagination } from "@/components/yks-sim/tercih-pagination";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIBRARY_DIALOG_XL } from "@/components/library/library-shell";
import { formatAtlasSira, formatAtlasTaban } from "@/lib/format/numbers";
import { bursDisplayLabel, type YokAtlasProgramEnriched } from "@/lib/yks-sim/atlas-enrich";
import { bolumDiliLabel } from "@/lib/yks-sim/atlas-program-display";
import { filterAtlasProgramsExtendedAll } from "@/lib/yks-sim/atlas-filter";
import { fetchAtlasMeta, fetchAtlasProgram, fetchFullAtlasPrograms } from "@/lib/yks-sim/fetch-atlas";
import {
  HEDEF_SORT_OPTIONS,
  programRowToTargetPayload,
  sortAtlasProgramsForHedef,
  type HedefSortKey,
} from "@/lib/yks-sim/hedef-sort";
import { parseTaban } from "@/lib/yks-sim/net-resolve";
import {
  isProgramInTercihList,
  moveTercihListToFirst,
  programToTercihListItem,
  readTercihList,
  saveTercihList,
  type TercihListItem,
} from "@/lib/yks-sim/tercih-list-storage";
import {
  orderPuanTypesForTercih,
  pickDefaultPuanTypes,
  TERCIH_DEFAULT_PUAN_TYPES,
} from "@/lib/yks-sim/tercih-defaults";
import {
  getCurrentUser,
  saveStudentTargetForUser,
} from "@/lib/yks-sim/student-sim-bridge";
import type { YokAtlasProgram } from "@/lib/universities/types";
import { cn } from "@/lib/utils";

const YEARS = ["2025", "2024", "2023"] as const;
const PAGE_SIZES = [15, 25, 50] as const;
const ATLAS_LEVEL = "lisans" as const;

const DEFAULT_FILTERS: TercihFilterState = {
  year: "2025",
  puanTipleri: [...TERCIH_DEFAULT_PUAN_TYPES],
  sehirler: [],
  universiteler: [],
  bolumler: [],
  bsMin: "",
  bsMax: "",
  kurum: "",
  ogrenim: "",
  burs: [],
  bolumDili: [],
  depremKontenjan: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

export function HedefPickerModal({ open, onOpenChange, onSaved }: Props) {
  const [filters, setFilters] = useState<TercihFilterState>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<HedefSortKey>("taban_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [allPrograms, setAllPrograms] = useState<YokAtlasProgramEnriched[]>([]);
  const [atlasLoading, setAtlasLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([]);
  const [allBolumler, setAllBolumler] = useState<string[]>([]);
  const [allPuanTipleri, setAllPuanTipleri] = useState<string[]>([]);
  const [previewKod, setPreviewKod] = useState("");
  const [previewNets, setPreviewNets] = useState<{ label: string; mid: number }[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTaban, setPreviewTaban] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const patchFilters = (patch: Partial<TercihFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
    setCurrentPage(1);
  };

  const clearChipsOnly = () => {
    setFilters((prev) => ({
      ...prev,
      sehirler: [],
      universiteler: [],
      bolumler: [],
      bsMin: "",
      bsMax: "",
      kurum: "",
      ogrenim: "",
      burs: [],
      bolumDili: [],
      depremKontenjan: "",
    }));
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!open) return;
    setAtlasLoading(true);
    void Promise.all([fetchAtlasMeta(ATLAS_LEVEL), fetchFullAtlasPrograms(ATLAS_LEVEL)])
      .then(([meta, programs]) => {
        setCities(meta.cities);
        setUniversities(meta.universities);
        setAllBolumler(meta.bolumler);
        const orderedPuan = orderPuanTypesForTercih(meta.puanTipleri);
        setAllPuanTipleri(orderedPuan);
        setFilters((prev) => ({
          ...prev,
          puanTipleri: pickDefaultPuanTypes(orderedPuan),
        }));
        setAllPrograms(programs as YokAtlasProgramEnriched[]);
      })
      .catch(() => toast.error("Atlas verisi yüklenemedi"))
      .finally(() => setAtlasLoading(false));
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters, sortKey, itemsPerPage]);

  const filterParams = useMemo(() => {
    const puanTipleri =
      filters.puanTipleri.length > 0 ? filters.puanTipleri : [...TERCIH_DEFAULT_PUAN_TYPES];
    return {
      year: filters.year,
      puanTipleri,
      sehirler: filters.sehirler.length ? filters.sehirler : undefined,
      universiteler: filters.universiteler.length ? filters.universiteler : undefined,
      bolumler: filters.bolumler.length ? filters.bolumler : undefined,
      bsMin: filters.bsMin ? Number(filters.bsMin) : null,
      bsMax: filters.bsMax ? Number(filters.bsMax) : null,
      kurum: filters.kurum || undefined,
      ogrenim: filters.ogrenim || undefined,
      burs: filters.burs.length ? filters.burs : undefined,
      bolumDili: filters.bolumDili.length ? filters.bolumDili : undefined,
      depremKontenjan: filters.depremKontenjan || undefined,
      search: debouncedSearch || undefined,
    };
  }, [filters, debouncedSearch]);

  const sortedRows = useMemo(() => {
    if (!allPrograms.length) return [];
    const { rows } = filterAtlasProgramsExtendedAll(allPrograms, filterParams);
    return sortAtlasProgramsForHedef(rows, filters.year, sortKey);
  }, [allPrograms, filterParams, filters.year, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / itemsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRows.slice(start, start + itemsPerPage);
  }, [sortedRows, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const loadPreview = useCallback(async (p: YokAtlasProgram) => {
    const kod = String(p.Program_Kodu ?? "").trim();
    if (!kod) return;
    setPreviewKod(kod);
    setPreviewLoading(true);
    setPreviewNets([]);
    setPreviewTaban(parseTaban(p.Taban_Puani_Guncel));
    try {
      const detail = await fetchAtlasProgram(kod);
      setPreviewNets(
        detail.spec.map((s) => ({
          label: s.label,
          mid: detail.nets[s.id] ?? 0,
        }))
      );
      setPreviewTaban(parseTaban(p.Taban_Puani_Guncel));
    } catch {
      toast.error("Program netleri yüklenemedi");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const handleSaveTarget = async (p: YokAtlasProgram & YokAtlasProgramEnriched) => {
    const u = getCurrentUser();
    if (!u) {
      toast.error("Öğrenci oturumu bulunamadı");
      return;
    }
    setSaving(true);
    try {
      const payload = programRowToTargetPayload(p, filters.year, p);
      const ok = saveStudentTargetForUser(u, payload);
      if (!ok) {
        toast.error("Hedef kaydedilemedi");
        return;
      }

      const kod = String(p.Program_Kodu ?? "").trim();
      const existing = isProgramInTercihList(readTercihList(u), kod);
      if (existing) {
        moveTercihListToFirst(u, existing.id);
      } else {
        const list = readTercihList(u);
        const item: TercihListItem = {
          id: `tl-${Date.now().toString(36)}`,
          sira: 1,
          addedAt: new Date().toISOString(),
          ...programToTercihListItem(p, filters.year, p),
        };
        saveTercihList(u, [item, ...list.map((x, i) => ({ ...x, sira: i + 2 }))]);
      }

      toast.success("Hedef program kaydedildi");
      onSaved?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const previewProgram = paginatedRows.find((p) => String(p.Program_Kodu) === previewKod);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(LIBRARY_DIALOG_XL, "gap-0 p-0")}>
        <DialogHeader className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-orange-500" />
            Hedef program seç
          </DialogTitle>
          <DialogDescription>
            Tercih Sihirbazı filtreleri ile program arayın; yerleşen net özetini görüp hedefinizi
            kaydedin.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Sol — filtreler */}
          <div className="max-h-[40vh] shrink-0 overflow-y-auto border-b border-slate-100 bg-slate-50/50 p-4 lg:max-h-none lg:w-[280px] lg:border-b-0 lg:border-r">
            <TercihFilterSidebar
              filters={filters}
              cities={cities}
              universities={universities}
              bolumler={allBolumler}
              puanTipleri={allPuanTipleri}
              years={YEARS}
              onChange={patchFilters}
              onReset={resetFilters}
            />
          </div>

          {/* Sağ — arama, sıralama, liste */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="space-y-3 border-b border-slate-100 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Üniversite veya bölüm ara…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 pl-10"
                  />
                </div>
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as HedefSortKey)}>
                  <SelectTrigger className="h-11 w-full sm:w-[240px]">
                    <SelectValue placeholder="Sıralama" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEDEF_SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ActiveFilterChips
                filters={filters}
                onChange={patchFilters}
                onClearAll={clearChipsOnly}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                <span>
                  {atlasLoading ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
                    </span>
                  ) : (
                    <>
                      <strong className="tabular-nums text-slate-900">
                        {sortedRows.length.toLocaleString("tr-TR")}
                      </strong>{" "}
                      program · {filters.year}
                    </>
                  )}
                </span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(v) => setItemsPerPage(Number(v))}
                >
                  <SelectTrigger className="h-9 w-[100px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} satır
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              {atlasLoading && paginatedRows.length === 0 ? (
                <div className="flex min-h-[240px] items-center justify-center text-slate-500">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Programlar yükleniyor…
                </div>
              ) : paginatedRows.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="font-medium text-slate-800">Sonuç bulunamadı</p>
                  <p className="mt-1 text-sm text-slate-500">Filtreleri genişletin veya aramayı değiştirin.</p>
                  <Button type="button" variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                    Filtreleri sıfırla
                  </Button>
                </div>
              ) : (
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="sticky top-0 z-[1] bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Program</th>
                      <th className="hidden px-3 py-3 md:table-cell">Şehir</th>
                      <th className="px-3 py-3 text-right">Taban</th>
                      <th className="px-3 py-3 text-right">Sıra</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((p) => {
                      const enriched = p as YokAtlasProgramEnriched;
                      const kod = String(p.Program_Kodu ?? "");
                      const selected = previewKod === kod;
                      const taban = p[filters.year ? (`Taban_${filters.year}` as keyof YokAtlasProgram) : "Taban_Puani_Guncel"] ?? p.Taban_Puani_Guncel;
                      const sira = p[filters.year ? (`Basari_${filters.year}` as keyof YokAtlasProgram) : "Basari_Sirasi_Guncel"] ?? p.Basari_Sirasi_Guncel;
                      return (
                        <tr
                          key={kod}
                          className={cn(
                            "cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/80",
                            selected && "bg-orange-50/60"
                          )}
                          onClick={() => void loadPreview(p)}
                        >
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{p.Universite}</p>
                            <p className="mt-0.5 text-xs text-slate-600">{p.Bolum}</p>
                            <p className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                              <span>{p.Puan_Tipi}</span>
                              {enriched.bursTuru ? (
                                <span>· {bursDisplayLabel(enriched.bursTuru)}</span>
                              ) : null}
                              {enriched.bolumDili ? (
                                <span>· {bolumDiliLabel(enriched.bolumDili)}</span>
                              ) : null}
                            </p>
                          </td>
                          <td className="hidden px-3 py-3 text-slate-600 md:table-cell">{p.Sehir}</td>
                          <td className="px-3 py-3 text-right font-mono text-slate-900">
                            {formatAtlasTaban(taban)}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-slate-700">
                            {formatAtlasSira(sira)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              disabled={saving}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleSaveTarget(enriched);
                              }}
                            >
                              <Check className="mr-1.5 h-3.5 w-3.5" />
                              Seç
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {sortedRows.length > itemsPerPage ? (
              <TercihPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedRows.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            ) : null}

            {/* Net önizleme — Net Sihirbazı verisi */}
            {previewKod ? (
              <div className="border-t border-slate-200 bg-slate-900 px-4 py-4 text-white sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Yerleşen net özeti
                    </p>
                    {previewProgram ? (
                      <p className="mt-1 truncate text-sm font-semibold">
                        {previewProgram.Universite} · {previewProgram.Bolum}
                      </p>
                    ) : null}
                    {previewTaban != null ? (
                      <p className="mt-0.5 text-xs text-slate-400">
                        Taban ~{previewTaban.toFixed(3)} · Net Sihirbazı modeli
                      </p>
                    ) : null}
                  </div>
                  {previewProgram ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="shrink-0 bg-white text-slate-900 hover:bg-slate-100"
                      disabled={saving}
                      onClick={() => void handleSaveTarget(previewProgram as YokAtlasProgramEnriched)}
                    >
                      Hedef olarak kaydet
                    </Button>
                  ) : null}
                </div>
                {previewLoading ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Netler hesaplanıyor…
                  </div>
                ) : previewNets.length > 0 ? (
                  <div className="mt-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto">
                    {previewNets.map((n) => (
                      <span
                        key={n.label}
                        className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium"
                      >
                        {n.label}: <strong className="text-orange-300">{n.mid}</strong> net
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 px-5 py-3 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
