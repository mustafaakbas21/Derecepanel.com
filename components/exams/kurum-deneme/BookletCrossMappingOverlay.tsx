"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "@/lib/notify";
import {
  TARGET_BOOKLETS,
  clampMasterRef,
  countFilledMappings,
  normalizeBookletMaps,
  resolveMasterQuestionLabel,
  serializeBookletMaps,
  validateBookletMaps,
  type BookletCrossMaps,
  type DecodedKonuRow,
  type TargetBooklet,
} from "@/lib/exams/booklet-cross-map";
import type { MatrixState } from "@/hooks/use-exam-matrix";

type Props = {
  open: boolean;
  onClose: () => void;
  matrix: MatrixState;
  initialMaps?: BookletCrossMaps;
  initialTargetBooklet?: TargetBooklet;
  getRowDecoded: (qi: number) => DecodedKonuRow;
  onApply: (maps: BookletCrossMaps) => void;
};

export function BookletCrossMappingOverlay({
  open,
  onClose,
  matrix,
  initialMaps,
  initialTargetBooklet = "B",
  getRowDecoded,
  onApply,
}: Props) {
  const [activeBooklet, setActiveBooklet] = useState<TargetBooklet>(initialTargetBooklet);
  const [maps, setMaps] = useState(() =>
    normalizeBookletMaps(initialMaps, matrix.n)
  );

  useEffect(() => {
    if (!open) return;
    setMaps(normalizeBookletMaps(initialMaps, matrix.n));
    setActiveBooklet(initialTargetBooklet);
  }, [open, initialMaps, matrix.n, initialTargetBooklet]);

  const activeMap = maps[activeBooklet];

  const masterRows = useMemo(() => {
    return Array.from({ length: matrix.n }, (_, i) => {
      const qNo = i + 1;
      const label =
        resolveMasterQuestionLabel(qNo, matrix, getRowDecoded) || "—";
      return { qNo, label };
    });
  }, [matrix, getRowDecoded]);

  const setTargetRef = useCallback(
    (targetIdx: number, raw: string) => {
      const masterQ = clampMasterRef(raw, matrix.n);
      setMaps((prev) => {
        const row = [...prev[activeBooklet]];
        row[targetIdx] = masterQ;
        return { ...prev, [activeBooklet]: row };
      });
    },
    [activeBooklet, matrix.n]
  );

  const clearActive = () => {
    setMaps((prev) => ({
      ...prev,
      [activeBooklet]: Array(matrix.n).fill(0),
    }));
  };

  const handleDistribute = () => {
    const normalized = normalizeBookletMaps(maps, matrix.n);
    const check = validateBookletMaps(normalized, matrix.n);
    if (!check.valid) {
      toast.error(check.errors[0] || "Eşleştirme geçersiz");
      return;
    }
    if (check.filled === 0) {
      toast.message("En az bir soru eşleştirmesi girin");
      return;
    }
    onApply(serializeBookletMaps(normalized));
    toast.success(
      `${check.filled} eşleştirme kaydedildi (${TARGET_BOOKLETS.filter((b) => countFilledMappings(normalized[b]) > 0).join(", ") || activeBooklet})`
    );
    onClose();
  };

  const filledActive = countFilledMappings(activeMap);
  const validation = validateBookletMaps(maps, matrix.n);

  if (!open) return null;

  return (
    <div
      className="kdy-booklet-overlay is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kdy-booklet-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="kdy-booklet-modal flex max-h-[min(92vh,880px)] w-full max-w-[min(1120px,96vw)] flex-col overflow-hidden rounded-2xl border shadow-md"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b p-5 md:p-6">
          <div className="min-w-0 flex-1">
            <h2
              id="kdy-booklet-title"
              className="text-lg font-semibold tracking-tight md:text-xl"
            >
              Kitapçık Eşleştirme Merkezi
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-normal opacity-80">
              Master matris (A kitapçığı) referans alınır. B, C ve D kitapçıklarında her
              hedef soru için A&apos;daki karşılık numarasını girin; konu önizlemesi anında
              görünür.
            </p>
            <div
              className="mt-4 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Hedef kitapçık"
            >
              {TARGET_BOOKLETS.map((bk) => {
                const filled = countFilledMappings(maps[bk]);
                const selected = activeBooklet === bk;
                return (
                  <button
                    key={bk}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      selected ? "shadow-sm" : "opacity-70 hover:opacity-100",
                    ].join(" ")}
                    onClick={() => setActiveBooklet(bk)}
                  >
                    {bk} Kitapçığı
                    {filled > 0 ? (
                      <span className="ml-2 text-xs font-normal opacity-70">
                        ({filled})
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className="btn-icon shrink-0 rounded-full border p-2 transition-opacity hover:opacity-80"
            aria-label="Kapat"
            onClick={onClose}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden p-5 md:grid-cols-2 md:gap-8 md:p-6">
          <section className="flex min-h-0 min-h-[280px] flex-col md:min-h-0">
            <div className="mb-3 shrink-0">
              <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">
                Master Matris (A Kitapçığı)
              </h3>
              <p className="mt-1 text-xs opacity-60">
                Kaynak doğruluk — salt okunur ({matrix.n} soru)
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm">
              <div className="grid shrink-0 grid-cols-[3.5rem_1fr] gap-3 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide opacity-70">
                <span>Soru No</span>
                <span>Konu / Kavram</span>
              </div>
              <ul
                className="min-h-0 flex-1 overflow-y-auto"
                aria-label="A kitapçığı soru listesi"
              >
                {masterRows.map((row) => (
                  <li
                    key={row.qNo}
                    className="grid min-h-[2.75rem] grid-cols-[3.5rem_1fr] items-center gap-3 border-b px-4 py-2 text-sm last:border-b-0"
                  >
                    <span className="font-medium tabular-nums">{row.qNo}</span>
                    <span className="truncate font-normal opacity-90" title={row.label}>
                      {row.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="flex min-h-0 min-h-[280px] flex-col md:min-h-0">
            <div className="mb-3 shrink-0">
              <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">
                Eşleştirme (Seçilen: {activeBooklet} Kitapçığı)
              </h3>
              <p className="mt-1 text-xs opacity-60">
                {filledActive} / {matrix.n} soru eşleştirildi
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm">
              <div className="grid shrink-0 grid-cols-[4.5rem_5.5rem_1fr] gap-3 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide opacity-70">
                <span>Hedef</span>
                <span>A Karşılığı</span>
                <span>Önizleme</span>
              </div>
              <ul
                className="min-h-0 flex-1 overflow-y-auto"
                aria-label={`${activeBooklet} kitapçığı eşleştirme`}
              >
                {activeMap.map((masterQ, targetIdx) => {
                  const preview = masterQ
                    ? resolveMasterQuestionLabel(masterQ, matrix, getRowDecoded)
                    : "";
                  return (
                    <li
                      key={targetIdx}
                      className="grid min-h-[2.75rem] grid-cols-[4.5rem_5.5rem_1fr] items-center gap-3 border-b px-4 py-2 text-sm last:border-b-0"
                    >
                      <span className="font-medium tabular-nums">
                        Soru {targetIdx + 1}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full rounded-lg border px-2 py-1.5 text-sm font-medium tabular-nums transition-all focus:outline-none focus:ring-2 focus:ring-offset-1"
                        placeholder="—"
                        value={masterQ > 0 ? String(masterQ) : ""}
                        aria-label={`${activeBooklet} soru ${targetIdx + 1} için A kitapçığı karşılığı`}
                        onChange={(e) => setTargetRef(targetIdx, e.target.value)}
                      />
                      {preview ? (
                        <span
                          className="truncate rounded-full border px-2.5 py-0.5 text-xs font-medium opacity-90"
                          title={preview}
                        >
                          A→{masterQ}: {preview}
                        </span>
                      ) : (
                        <span className="text-xs opacity-40">Numara girin</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>

        {!validation.valid && validation.errors.length > 0 ? (
          <p className="shrink-0 px-6 pb-2 text-xs font-medium opacity-80" role="alert">
            {validation.errors[0]}
          </p>
        ) : null}

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t p-5 md:p-6">
          <button
            type="button"
            className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5"
            onClick={clearActive}
          >
            Tümünü Temizle
          </button>
          <button
            type="button"
            className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!validation.valid || validation.filled === 0}
            onClick={handleDistribute}
          >
            ✨ Eşleştirmeyi Dağıt
          </button>
        </footer>
      </div>
    </div>
  );
}
