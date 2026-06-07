"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CatalogStudent, ParseRow } from "@/lib/exams/types";
import { bestFuzzyMatches } from "@/lib/exams/student-catalog-bridge";

export function BulkMatchModal({
  open,
  onClose,
  unmatchedRows,
  students,
  onApplyAll,
}: {
  open: boolean;
  onClose: () => void;
  unmatchedRows: ParseRow[];
  students: CatalogStudent[];
  onApplyAll: (pairs: { rowId: string; student: CatalogStudent }[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const row = unmatchedRows[index] ?? null;

  const suggestions = useMemo(
    () => (row ? bestFuzzyMatches(students, row.name, 3) : []),
    [row, students]
  );

  const pick = (student: CatalogStudent) => {
    if (!row) return;
    onApplyAll([{ rowId: row.id, student }]);
    if (index < unmatchedRows.length - 1) setIndex((i) => i + 1);
    else onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Toplu eşleştirme</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Dosyadan</p>
            {row ? (
              <>
                <p className="mt-2 font-medium text-slate-900">{row.name || "—"}</p>
                <p className="text-sm text-slate-600">No: {row.no || "—"}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {index + 1} / {unmatchedRows.length} eşleşmeyen
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Eşleşmeyen kalmadı.</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Katalog</p>
            <ul className="mt-2 space-y-2">
              {suggestions.map(({ student, score }) => (
                <li key={student.id}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => pick(student)}
                  >
                    {student.name} ({student.code}) — %{Math.round(score * 100)}
                  </Button>
                </li>
              ))}
              {suggestions.length === 0 && (
                <p className="text-sm text-slate-500">Öneri yok — katalogdan manuel seçin.</p>
              )}
              {students.slice(0, 8).map((s) => (
                <li key={s.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => pick(s)}
                  >
                    {s.name}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
          <Button
            variant="primary"
            disabled={index >= unmatchedRows.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            Atla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
