"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { appToast, toast } from "@/lib/notify";

const KurumDenemeWizardModal = dynamic(
  () =>
    import("@/components/exams/kurum-deneme/KurumDenemeWizardModal").then(
      (m) => m.KurumDenemeWizardModal
    ),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGlobalExams } from "@/hooks/use-global-exams";
import {
  badgeClass,
  buildMonthOptions,
  buildNearestFive,
  buildTableList,
  daysFromToday,
  DAYS_TR,
  dotClass,
  formatTrDate,
  isoDate,
  MONTHS_TR,
  pageMetaText,
  paginate,
  passesTur,
  relativeDayLabel,
  todayIso,
  typesOnDate,
  uniqueYayinevi,
  type TurFilter,
} from "@/lib/exams/global-exam-calendar";
import type { GlobalExam } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

import "./global-deneme-takvim.css";

const TUR_SEGMENTS: { id: TurFilter; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "TYT", label: "TYT" },
  { id: "AYT", label: "AYT" },
  { id: "YDT", label: "YDT" },
  { id: "YKS", label: "YKS" },
];

const EMPTY_LIVE_MSG = "Henüz global deneme takvimi açıklanmadı";

type Props = {
  readonly?: boolean;
};

export function GlobalDenemeCockpit({ readonly = false }: Props) {
  const { confirm, ConfirmHost } = useConfirm();
  const { list, hydrated, save, remove } = useGlobalExams();
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [tur, setTur] = useState<TurFilter>("all");
  const [ay, setAy] = useState("");
  const [search, setSearch] = useState("");
  const [yayinevi, setYayinevi] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [tablePage, setTablePage] = useState(1);
  const [tableFade, setTableFade] = useState(false);
  const [, setTick] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GlobalExam | null>(null);
  const [wizardStep, setWizardStep] = useState(0);

  const syncTur = useCallback((next: TurFilter) => {
    setTur(next);
    setTablePage(1);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    const onVis = () => setTick((t) => t + 1);
    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const monthOpts = useMemo(() => buildMonthOptions(list), [list]);
  const yayineviOpts = useMemo(() => uniqueYayinevi(list), [list]);

  const filters = useMemo(
    () => ({ tur, ay, search, yayinevi }),
    [tur, ay, search, yayinevi]
  );

  const tableAll = useMemo(() => buildTableList(list, filters), [list, filters]);
  const nearest = useMemo(() => buildNearestFive(list, tur), [list, tur]);

  const pageData = useMemo(
    () => paginate(tableAll, tablePage, pageSize),
    [tableAll, tablePage, pageSize]
  );

  useEffect(() => {
    if (tablePage > pageData.totalPages) setTablePage(pageData.totalPages);
  }, [pageData.totalPages, tablePage]);

  const bumpTablePage = (next: number) => {
    setTableFade(true);
    window.setTimeout(() => {
      setTablePage(next);
      setTableFade(false);
    }, 120);
  };

  const calCells = useMemo(() => {
    const y = calYear;
    const m = calMonth;
    const first = new Date(y, m - 1, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m, 0).getDate();
    const prevMonthDays = new Date(y, m - 1, 0).getDate();
    const t0 = todayIso();
    const cells: {
      key: string;
      day: number;
      outside?: boolean;
      types: string[];
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    for (let i = 0; i < startPad; i++) {
      const dom = prevMonthDays - startPad + i + 1;
      cells.push({
        key: `pad-prev-${i}`,
        day: dom,
        outside: true,
        types: [],
        isToday: false,
        isSelected: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = isoDate(y, m, d);
      const types = typesOnDate(list, y, m, d, tur);
      cells.push({
        key,
        day: d,
        types,
        isToday: key === t0,
        isSelected: selectedKey === key,
      });
    }

    const used = startPad + daysInMonth;
    const rem = used % 7 === 0 ? 0 : 7 - (used % 7);
    for (let j = 1; j <= rem; j++) {
      cells.push({
        key: `pad-next-${j}`,
        day: j,
        outside: true,
        types: [],
        isToday: false,
        isSelected: false,
      });
    }
    return cells;
  }, [calYear, calMonth, list, tur, selectedKey]);

  const dayPickList = useMemo(() => {
    if (!selectedKey) return [];
    return list
      .filter((r) => r.tarih === selectedKey && passesTur(r, tur))
      .sort((a, b) => (a.saat || "").localeCompare(b.saat || ""));
  }, [list, selectedKey, tur]);

  const openNew = () => {
    setEditTarget(null);
    setWizardStep(0);
    setModalOpen(true);
  };

  const openEdit = (item: GlobalExam, step = 0) => {
    setEditTarget(item);
    setWizardStep(step);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, ad: string) => {
    const ok = await confirm({
      title: `"${ad}" silinsin mi?`,
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    remove(id);
    appToast.examDeleted();
  };

  const handleDetail = (r: GlobalExam) => {
    toast.info(r.ad, {
      description: `${formatTrDate(r.tarih)} · ${r.saat || "—"} · ${r.tur} · ${r.yayinevi || "—"}`,
    });
  };

  const prevMonth = () => {
    if (calMonth === 1) {
      setCalYear((y) => y - 1);
      setCalMonth(12);
    } else setCalMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 12) {
      setCalYear((y) => y + 1);
      setCalMonth(1);
    } else setCalMonth((m) => m + 1);
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-slate-500">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div
      className="dgt-page"
      data-dnm-context="global"
      data-dgt-readonly={readonly ? "1" : undefined}
    >
      <header className="dgt-hero">
        <h1 className="dgt-hero__title">Global Deneme Takvimi</h1>
        <p className="dgt-hero__lead">
          {readonly
            ? "Merkezi deneme takvimi (salt okunur). Yaklaşan sınavları takvim ve listeden izleyin."
            : "Merkezi YKS deneme takvimi — planlayın, matris ve yayın ayarlarını üç adımda tamamlayın."}
        </p>
      </header>

      <div className="dgt-toolbar">
        <span className="text-xs font-semibold text-slate-500">Takvim türü</span>
        <div id="dgt-filter-tur" className="dgt-segment" role="group" aria-label="Sınav türü">
          {TUR_SEGMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              data-dgt-tur={s.id}
              className={cn("dgt-segment__btn", tur === s.id && "dgt-segment__btn--active")}
              onClick={() => syncTur(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dgt-top-split">
        <div className="dgt-cal-col">
          <div className="dgt-cal-shell dgt-cal-shell--compact">
            <div className="dgt-cal-header">
              <button
                type="button"
                id="dgt-cal-prev"
                className="dgt-cal-nav-btn"
                aria-label="Önceki ay"
                onClick={prevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 id="dgt-cal-title" className="dgt-cal-title">
                {MONTHS_TR[calMonth - 1]} {calYear}
              </h2>
              <button
                type="button"
                id="dgt-cal-next"
                className="dgt-cal-nav-btn"
                aria-label="Sonraki ay"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div id="dgt-cal-grid" className="dgt-cal__grid">
              {DAYS_TR.map((d) => (
                <div key={d} className="dgt-cal__dow">
                  {d}
                </div>
              ))}
              {calCells.map((cell) => (
                <button
                  key={cell.key}
                  type="button"
                  disabled={cell.outside}
                  className={cn(
                    "dgt-cal__cell",
                    cell.outside && "dgt-cal__cell--outside",
                    cell.types.length > 0 && "dgt-cal__cell--has-exam",
                    cell.isToday && "dgt-cal__cell--today",
                    cell.isSelected && "dgt-cal__cell--selected"
                  )}
                  onClick={() => {
                    if (cell.outside) return;
                    setSelectedKey((k) => (k === cell.key ? null : cell.key));
                  }}
                >
                  <span className="dgt-cal__num">{cell.day}</span>
                  <span className="dgt-cal__dots">
                    {cell.types.map((t) => (
                      <span key={t} className={dotClass(t)} aria-hidden />
                    ))}
                  </span>
                  {cell.types.length > 0 && (
                    <span className="dgt-cal__underline" aria-hidden />
                  )}
                </button>
              ))}
            </div>
            <div className="dgt-cal-day">
              <div className="dgt-cal-day__head">
                <h3 id="dgt-cal-day-title" className="dgt-cal-day__title">
                  {selectedKey ? formatTrDate(selectedKey) : "Seçilen günün denemeleri"}
                </h3>
                {selectedKey && (
                  <button
                    type="button"
                    id="dgt-clear-day"
                    className="text-xs font-semibold text-blue-600"
                    onClick={() => setSelectedKey(null)}
                  >
                    Temizle
                  </button>
                )}
              </div>
              {!selectedKey && (
                <p id="dgt-cal-day-hint" className="dgt-cal-day__hint">
                  Takvimden bir güne tıklayarak o günün denemelerini listeleyin.
                </p>
              )}
              {selectedKey && (
                <div id="dgt-cal-day-list" className="mt-2 space-y-2">
                  {dayPickList.length === 0 ? (
                    <p className="dgt-cal-day-empty text-sm text-slate-500">
                      Bu tarihte deneme yok (veya tür filtresi dışında).
                    </p>
                  ) : (
                    dayPickList.map((r) => (
                      <article key={r.id} className="dgt-cal-day-item">
                        <div className="dgt-cal-day-item__top">
                          <h4 className="dgt-cal-day-item__name">{r.ad}</h4>
                          <span className={badgeClass(r.tur)}>{r.tur}</span>
                        </div>
                        <div className="dgt-cal-day-item__when">
                          {r.saat || "—"} · {r.yayinevi || "—"}
                        </div>
                        <div className="dgt-cal-day-item__rel">
                          {relativeDayLabel(daysFromToday(r.tarih))}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="dgt-nearest">
          <h2 className="dgt-nearest__title">En yakın 5</h2>
          <p className="dgt-nearest__sub">Bugünden itibaren · tür filtresine göre</p>
          <div id="dgt-nearest-list" className="dgt-nearest-list">
            {nearest.length === 0 ? (
              <p className="dgt-nearest-empty text-sm text-slate-500">
                {list.length
                  ? "Önümüzdeki tarihlerde sınav yok (veya tür filtresi dışında)."
                  : EMPTY_LIVE_MSG}
              </p>
            ) : (
              nearest.map((r) => (
                <article key={r.id} className="dgt-nearest-item">
                  <div className="dgt-nearest-item__top">
                    <h3 className="dgt-nearest-item__name">{r.ad}</h3>
                    <span className={badgeClass(r.tur)}>{r.tur}</span>
                  </div>
                  <div className="dgt-nearest-item__when">
                    {formatTrDate(r.tarih)} · {r.saat || "—"}
                  </div>
                  <div className="dgt-nearest-item__rel">
                    {relativeDayLabel(daysFromToday(r.tarih))}
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>

      <section className="dgt-list-section">
        <div className="dgt-list-section__head">
          <div>
            <h2 id="dgt-panel-title" className="dgt-list-section__title">
              Yaklaşan denemeler
            </h2>
            <p id="dgt-panel-sub" className="dgt-list-section__sub">
              {readonly
                ? "Koç paneliyle aynı veri; yalnızca görüntüleme. Bugünden sonraki sınavlar."
                : "Bugünden sonraki sınavlar (ay, arama ve yayınevi filtresi uygulanır)."}
            </p>
          </div>
          {!readonly && (
            <Button
              id="dgt-open-modal"
              variant="primary"
              onClick={openNew}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Deneme Planla
            </Button>
          )}
        </div>

        <div className="dgt-toolbar dgt-toolbar--above-list">
          <Select
            value={ay || "all"}
            onValueChange={(v) => {
              setAy(v === "all" ? "" : v);
              setTablePage(1);
            }}
          >
            <SelectTrigger id="dgt-filter-ay" className="w-[160px]">
              <SelectValue placeholder="Tüm aylar" />
            </SelectTrigger>
            <SelectContent>
              {monthOpts.map((o) => (
                <SelectItem key={o.value || "all"} value={o.value || "all"}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="kdy-filter-bar">
          <Input
            id="dgt-filter-search"
            placeholder="Deneme adı ara…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setTablePage(1);
            }}
            className="max-w-xs"
          />
          <Select
            value={tur}
            onValueChange={(v) => syncTur(v as TurFilter)}
          >
            <SelectTrigger id="dgt-filter-tur-select" className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TUR_SEGMENTS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={yayinevi || "all"}
            onValueChange={(v) => {
              setYayinevi(v === "all" ? "" : v);
              setTablePage(1);
            }}
          >
            <SelectTrigger id="dgt-filter-yayinevi" className="w-[160px]">
              <SelectValue placeholder="Yayınevi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {yayineviOpts.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span id="dgt-filter-count" className="text-sm font-semibold text-slate-600">
            {tableAll.length} kayıt
          </span>
        </div>

        <div className="dgt-exam-table-wrap">
          <table className="dgt-exam-table dgt-exam-table--dense">
            <thead>
              <tr>
                <th>Deneme</th>
                <th>Tarih</th>
                <th>Saat</th>
                <th>Tür</th>
                <th>Yayınevi</th>
                {!readonly && <th className="dgt-th-actions">İşlem</th>}
              </tr>
            </thead>
            <tbody
              id="dgt-exam-table-body"
              className={cn("dgt-exam-table--fade", !tableFade && "is-in")}
            >
              {tableAll.length === 0 ? (
                <tr>
                  <td
                    colSpan={readonly ? 5 : 6}
                    className="dgt-panel-empty"
                  >
                    {list.length
                      ? "Tabloda gösterilecek yaklaşan sınav yok."
                      : EMPTY_LIVE_MSG}
                  </td>
                </tr>
              ) : (
                pageData.slice.map((r) => (
                  <tr key={r.id}>
                    <td className="dgt-exam-table__name">
                      <span className="dgt-exam-name" title={r.ad}>
                        {r.ad}
                      </span>
                    </td>
                    <td>{formatTrDate(r.tarih)}</td>
                    <td>{r.saat || "—"}</td>
                    <td>
                      <span className={badgeClass(r.tur)}>{r.tur}</span>
                    </td>
                    <td>{r.yayinevi || "—"}</td>
                    {!readonly && (
                      <td>
                        <div className="dgt-row-actions">
                          <button type="button" onClick={() => openEdit(r, 0)}>
                            Düzenle
                          </button>
                          <button type="button" onClick={() => handleDetail(r)}>
                            Detay
                          </button>
                          <button
                            type="button"
                            className="dgt-row-actions__danger"
                            onClick={() => handleDelete(r.id, r.ad)}
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dgt-pagination">
          <div className="flex items-center gap-2">
            <span>Sayfa boyutu</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setTablePage(1);
              }}
            >
              <SelectTrigger id="dgt-page-size" className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span id="dgt-page-meta">
            {pageMetaText(
              pageData.from,
              pageData.to,
              tableAll.length,
              tablePage,
              pageData.totalPages
            )}
          </span>
          <div className="flex gap-2">
            <Button
              id="dgt-page-prev"
              variant="outline"
              size="sm"
              disabled={tablePage <= 1 || tableAll.length === 0}
              onClick={() => bumpTablePage(tablePage - 1)}
            >
              Önceki
            </Button>
            <Button
              id="dgt-page-next"
              variant="outline"
              size="sm"
              disabled={tablePage >= pageData.totalPages || tableAll.length === 0}
              onClick={() => bumpTablePage(tablePage + 1)}
            >
              Sonraki
            </Button>
          </div>
        </div>
      </section>

      {!readonly && modalOpen && (
        <KurumDenemeWizardModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initial={editTarget}
          initialStep={wizardStep}
          context="global"
          onSave={(item) => {
            save(item as GlobalExam);
            setModalOpen(false);
            appToast.success(
              editTarget ? "Deneme güncellendi" : "Global deneme planlandı"
            );
          }}
        />
      )}
      {ConfirmHost}
    </div>
  );
}
