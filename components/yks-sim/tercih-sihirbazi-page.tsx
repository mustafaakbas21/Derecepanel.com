"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GraduationCap, ListOrdered, Loader2, Plus, Search } from "lucide-react";
import { toast } from "@/lib/notify";

import {
  ActiveFilterChips,
  puanTipBadgeClass,
  TercihFilterSidebar,
  type TercihFilterState,
} from "@/components/yks-sim/tercih-sihirbazi-filters";
import { TercihListActions } from "@/components/yks-sim/tercih-list-actions";
import { TercihListModal } from "@/components/yks-sim/tercih-list-modal";
import { TercihPagination } from "@/components/yks-sim/tercih-pagination";
import { YksSimShell } from "@/components/yks-sim/yks-sim-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIBRARY_PANEL_CLASS } from "@/components/library/library-shell";
import { bursDisplayLabel, type YokAtlasProgramEnriched } from "@/lib/yks-sim/atlas-enrich";
import {
  bolumDiliLabel,
  depremKontenjanLabel,
} from "@/lib/yks-sim/atlas-program-display";
import { formatAtlasSira, formatAtlasTaban } from "@/lib/format/numbers";
import {
  basariKey,
  filterAtlasProgramsExtendedAll,
  tabanKey,
} from "@/lib/yks-sim/atlas-filter";
import { fetchAtlasMeta, fetchFullAtlasPrograms } from "@/lib/yks-sim/fetch-atlas";
import { consumeTercihFromPuanPayload } from "@/lib/yks-sim/tercih-bridge";
import { useConfirm } from "@/hooks/use-confirm";
import {
  addToTercihList,
  clearTercihList,
  formatTercihListSummary,
  isProgramInTercihList,
  readTercihList,
  TERCIH_LIST_CHANGE,
  type TercihListItem,
} from "@/lib/yks-sim/tercih-list-storage";
import {
  orderPuanTypesForTercih,
  pickDefaultPuanTypes,
  TERCIH_DEFAULT_PUAN_TYPES,
} from "@/lib/yks-sim/tercih-defaults";
import {
  readSelectedTercihStudentId,
  resolveTercihSimUser,
  saveSelectedTercihStudentId,
} from "@/lib/yks-sim/tercih-student";
import type { YokAtlasProgram } from "@/lib/universities/types";
import { cn } from "@/lib/utils";

const YEARS = ["2025", "2024", "2023"] as const;
const PAGE_SIZES = [10, 25, 50, 100] as const;
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

type Props = { mode?: "coach" | "student" };

export function TercihSihirbaziPage({ mode = "coach" }: Props) {
  const [filters, setFilters] = useState<TercihFilterState>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [allPrograms, setAllPrograms] = useState<YokAtlasProgramEnriched[]>([]);
  const [atlasLoading, setAtlasLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([]);
  const [allBolumler, setAllBolumler] = useState<string[]>([]);
  const [allPuanTipleri, setAllPuanTipleri] = useState<string[]>([]);
  const [tercihList, setTercihList] = useState<TercihListItem[]>([]);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const bridgePuanAppliedRef = useRef(false);
  const [puanBanner, setPuanBanner] = useState<string | null>(null);
  const { confirm, ConfirmHost } = useConfirm();

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

  const tercihSimUser = useMemo(
    () => resolveTercihSimUser(mode, selectedStudentId),
    [mode, selectedStudentId]
  );

  const selectedStudentName = tercihSimUser?.name || "";

  useEffect(() => {
    if (mode === "coach") {
      setSelectedStudentId(readSelectedTercihStudentId());
    }
  }, [mode]);

  const refreshTercihList = useCallback(() => {
    const u = resolveTercihSimUser(mode, selectedStudentId);
    setTercihList(readTercihList(u));
  }, [mode, selectedStudentId]);

  useEffect(() => {
    refreshTercihList();
    const onListChange = () => refreshTercihList();
    window.addEventListener(TERCIH_LIST_CHANGE, onListChange);
    return () => window.removeEventListener(TERCIH_LIST_CHANGE, onListChange);
  }, [refreshTercihList]);

  const handleSelectedStudentChange = (ogrenciId: string) => {
    setSelectedStudentId(ogrenciId);
    if (mode === "coach") saveSelectedTercihStudentId(ogrenciId);
  };

  const listSummary = useMemo(() => formatTercihListSummary(tercihList), [tercihList]);

  useEffect(() => {
    const phb = consumeTercihFromPuanPayload();
    if (phb) {
      bridgePuanAppliedRef.current = true;
      setFilters((prev) => ({ ...prev, puanTipleri: [phb.primaryPuanTipi] }));
      const puan =
        phb.puanlar[phb.primaryPuanTipi] ??
        phb.puanlar.SAY ??
        phb.puanlar.TYT ??
        null;
      setPuanBanner(
        `Puan Hesaplama köprüsü: ${phb.primaryPuanTipi} · tahmini ${puan != null ? puan.toFixed(3) : "—"}`
      );
    }
    const applyMeta = (m: {
      cities: string[];
      universities: string[];
      bolumler: string[];
      puanTipleri: string[];
    }) => {
      setCities(m.cities);
      setUniversities(m.universities);
      setAllBolumler(m.bolumler);
      const orderedPuan = orderPuanTypesForTercih(m.puanTipleri);
      setAllPuanTipleri(orderedPuan);
      if (!bridgePuanAppliedRef.current) {
        setFilters((prev) => ({
          ...prev,
          puanTipleri: pickDefaultPuanTypes(orderedPuan),
        }));
      }
    };
    void Promise.all([fetchAtlasMeta(ATLAS_LEVEL), fetchFullAtlasPrograms(ATLAS_LEVEL)])
      .then(([meta, programs]) => {
        applyMeta(meta);
        setAllPrograms(programs as YokAtlasProgramEnriched[]);
      })
      .catch(() => {
        toast.error("Atlas verisi yüklenemedi");
      })
      .finally(() => setAtlasLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters, itemsPerPage]);

  const filterParams = useMemo(() => {
    const puanTipleri =
      filters.puanTipleri.length > 0
        ? filters.puanTipleri
        : [...TERCIH_DEFAULT_PUAN_TYPES];

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

  const { filteredRows, filteredTotal, puanRelaxed } = useMemo(() => {
    if (!allPrograms.length) {
      return { filteredRows: [] as YokAtlasProgramEnriched[], filteredTotal: 0, puanRelaxed: false };
    }
    const result = filterAtlasProgramsExtendedAll(allPrograms, filterParams);
    return {
      filteredRows: result.rows,
      filteredTotal: result.total,
      puanRelaxed: result.puanRelaxed,
    };
  }, [allPrograms, filterParams]);

  const totalPages = Math.max(1, Math.ceil(filteredTotal / itemsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const activeFilterCount = useMemo(() => {
    return (
      filters.sehirler.length +
      filters.universiteler.length +
      filters.bolumler.length +
      filters.burs.length +
      (filters.bsMin || filters.bsMax ? 1 : 0) +
      (filters.kurum ? 1 : 0) +
      (filters.ogrenim ? 1 : 0) +
      filters.bolumDili.length +
      (filters.depremKontenjan ? 1 : 0)
    );
  }, [filters]);

  const handleClearTercihList = async () => {
    const u = resolveTercihSimUser(mode, selectedStudentId);
    if (!u) {
      if (mode === "coach") {
        toast.error("Önce tercih listesi için öğrenci seçin");
        setListModalOpen(true);
      }
      return;
    }
    if (!tercihList.length) {
      toast.message("Liste zaten boş");
      return;
    }
    const ok = await confirm({
      title: "Tercih listesi temizlensin mi?",
      description: selectedStudentName
        ? `${selectedStudentName} için tüm tercih kayıtları silinir.`
        : "Tüm tercih kayıtları silinir. Bu işlem geri alınamaz.",
      confirmLabel: "Evet, temizle",
      destructive: true,
    });
    if (!ok) return;
    if (clearTercihList(u)) {
      toast.success("Tercih listesi temizlendi");
      refreshTercihList();
    }
  };

  const addProgramToList = (p: YokAtlasProgram & { bursTuru?: string }) => {
    const u = resolveTercihSimUser(mode, selectedStudentId);
    if (!u) {
      if (mode === "coach") {
        toast.error("Önce tercih listesi için öğrenci seçin");
        setListModalOpen(true);
      } else {
        toast.error("Öğrenci oturumu bulunamadı");
      }
      return;
    }
    const enriched = p as YokAtlasProgramEnriched;
    const result = addToTercihList(u, p, filters.year, enriched);
    if (result.ok) {
      toast.success("Tercih listesine eklendi");
      refreshTercihList();
    } else if (result.reason === "duplicate") {
      toast.message("Bu program zaten tercih listenizde");
      setListModalOpen(true);
    } else {
      toast.error("Listeye eklenemedi");
    }
  };

  const filterSidebar = (
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
  );

  return (
    <YksSimShell
      mode={mode}
      title="Tercih Sihirbazı"
      subtitle="YÖK Atlas programlarını filtreleyin, tercih listenizi oluşturun ve A4 çıktı alın."
    >
      {/* Üst bilgi şeridi */}
      <div className="grid gap-3 sm:grid-cols-2">
        {tercihList.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3.5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <ListOrdered className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                  {selectedStudentName
                    ? `${selectedStudentName} · ${tercihList.length} program`
                    : `Tercih listeniz · ${tercihList.length} program`}
                </p>
                <p className="mt-0.5 font-semibold text-emerald-950">{listSummary}</p>
              </div>
            </div>
            <TercihListActions
              listCount={tercihList.length}
              onOpenList={() => setListModalOpen(true)}
              onClearList={() => void handleClearTercihList()}
              clearDisabled={!tercihSimUser}
              className="shrink-0"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Tercih listeniz boş</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tablodan programa <strong>Tercih listesine ekle</strong> ile sıralı listenizi
                  oluşturun.
                </p>
              </div>
            </div>
            <TercihListActions
              listCount={0}
              onOpenList={() => setListModalOpen(true)}
              onClearList={() => void handleClearTercihList()}
              clearDisabled
              className="shrink-0"
            />
          </div>
        )}
      </div>

      {puanBanner && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {puanBanner}
        </div>
      )}

      {puanRelaxed && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          Bölüm filtresi için puan tipi gevşetildi — önlisans veya farklı puan türü eşleşmeleri
          dahil edildi.
        </div>
      )}

      {/* Mobil filtre tetikleyici */}
      <div className="lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setMobileFiltersOpen((v) => !v)}
        >
          <span>Filtreler {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}</span>
          <span className="text-xs text-slate-500">{mobileFiltersOpen ? "Gizle" : "Göster"}</span>
        </Button>
        {mobileFiltersOpen && <div className="mt-3">{filterSidebar}</div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden lg:block">{filterSidebar}</div>

        {/* Sonuç paneli */}
        <section className={cn(LIBRARY_PANEL_CLASS, "flex min-w-0 flex-col")}>
          {/* Araç çubuğu */}
          <div className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Üniversite veya bölüm ara…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 pl-10"
                />
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {atlasLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  )}
                  <span>
                    <strong className="tabular-nums text-slate-900">
                      {filteredTotal.toLocaleString("tr-TR")}
                    </strong>{" "}
                    program
                  </span>
                </div>
              </div>
            </div>

            <ActiveFilterChips
              filters={filters}
              onChange={patchFilters}
              onClearAll={clearChipsOnly}
            />
          </div>

          {/* Tablo üstü — yıl + sayfa boyutu */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <p className="text-sm text-slate-600">
              Yıl <strong className="text-slate-900">{filters.year}</strong>
              <span className="mx-2 text-slate-300">·</span>
              Atlas{" "}
              <strong className="tabular-nums text-slate-900">
                {allPrograms.length.toLocaleString("tr-TR")}
              </strong>{" "}
              program
            </p>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(v) => {
                setItemsPerPage(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[110px] text-xs">
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

          {/* Tablo */}
          <div className="relative min-h-[320px] flex-1 overflow-x-auto">
            {atlasLoading && paginatedRows.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Programlar yükleniyor…
              </div>
            ) : (
            <table className="w-full min-w-[880px] text-sm">
              <thead className="sticky top-0 z-[1] bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500 shadow-[0_1px_0_0_rgb(226_232_240)]">
                <tr>
                  <th className="px-4 py-3 sm:px-5">Program</th>
                  <th className="hidden px-3 py-3 lg:table-cell">Dil</th>
                  <th className="hidden px-3 py-3 md:table-cell">Burs</th>
                  <th className="hidden px-3 py-3 xl:table-cell">Deprem k.</th>
                  <th className="hidden px-3 py-3 sm:table-cell">Şehir</th>
                  <th className="px-3 py-3 text-right">Taban</th>
                  <th className="px-3 py-3 text-right">Sıra</th>
                  <th className="px-4 py-3 sm:px-5" />
                </tr>
              </thead>
              <tbody>
                {!atlasLoading && paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <p className="font-medium text-slate-800">Sonuç bulunamadı</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Filtreleri genişletin veya arama metnini değiştirin.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={resetFilters}
                      >
                        Filtreleri sıfırla
                      </Button>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((p) => {
                    const enriched = p as YokAtlasProgramEnriched;
                    const listEntry = isProgramInTercihList(
                      tercihList,
                      String(p.Program_Kodu ?? "")
                    );
                    const uniLabel =
                      enriched.universiteDisplay ?? String(p.Universite ?? "");
                    const dilLabel = bolumDiliLabel(enriched.bolumDili ?? "turkce");
                    const depremLabel = depremKontenjanLabel(p);
                    const taban = formatAtlasTaban(
                      p[tabanKey(filters.year)] ?? p.Taban_Puani_Guncel
                    );
                    const basari = formatAtlasSira(
                      p[basariKey(filters.year)] ?? p.Basari_Sirasi_Guncel
                    );

                    return (
                      <tr
                        key={p.Program_Kodu}
                        className={cn(
                          "group border-t border-slate-100 transition-colors hover:bg-slate-50/80",
                          listEntry && "bg-emerald-50/90 hover:bg-emerald-50"
                        )}
                      >
                        <td className="px-4 py-3.5 sm:px-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                                puanTipBadgeClass(p.Puan_Tipi)
                              )}
                            >
                              {p.Puan_Tipi}
                            </span>
                            {listEntry ? (
                              <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                #{listEntry.sira}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 font-semibold leading-snug text-slate-900">
                            {p.Bolum}
                          </p>
                          <p className="text-xs text-slate-500">{uniLabel}</p>
                          <p className="mt-1 text-[11px] text-slate-400 lg:hidden">
                            {dilLabel} · {bursDisplayLabel(enriched.bursTuru || "Burssuz")}
                            {depremLabel === "Var" ? " · Deprem k. var" : ""} · {p.Sehir}
                          </p>
                        </td>
                        <td className="hidden px-3 py-3.5 text-xs font-medium text-slate-700 lg:table-cell">
                          {dilLabel}
                        </td>
                        <td className="hidden px-3 py-3.5 text-xs text-slate-600 md:table-cell">
                          {bursDisplayLabel(enriched.bursTuru || "Burssuz")}
                        </td>
                        <td className="hidden px-3 py-3.5 text-xs xl:table-cell">
                          <span
                            className={cn(
                              "font-medium",
                              depremLabel === "Var" ? "text-amber-800" : "text-slate-400"
                            )}
                          >
                            {depremLabel}
                          </span>
                        </td>
                        <td className="hidden px-3 py-3.5 text-slate-600 sm:table-cell">
                          {p.Sehir}
                        </td>
                        <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                          {taban}
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-slate-700">
                          {basari}
                        </td>
                        <td className="px-4 py-3.5 text-right sm:px-5">
                          {listEntry ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-300 text-emerald-800"
                              onClick={() => setListModalOpen(true)}
                            >
                              Listede · #{listEntry.sira}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="primary"
                              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              onClick={() => addProgramToList(p)}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              Tercih listesine ekle
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            )}
          </div>

          <TercihPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTotal}
            itemsPerPage={itemsPerPage}
            disabled={atlasLoading}
            onPageChange={setCurrentPage}
          />
        </section>
      </div>

      <TercihListModal
        open={listModalOpen}
        onOpenChange={setListModalOpen}
        onListChange={refreshTercihList}
        mode={mode}
        selectedStudentId={selectedStudentId}
        onSelectedStudentIdChange={handleSelectedStudentChange}
      />
      {ConfirmHost}
    </YksSimShell>
  );
}
