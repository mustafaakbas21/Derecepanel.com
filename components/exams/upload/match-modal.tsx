"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CatalogStudent, ParseRow } from "@/lib/exams/types";
import { bestFuzzyMatches } from "@/lib/exams/student-catalog-bridge";
import { useMemo, useState } from "react";

export function MatchModal({
  row,
  students,
  open,
  onClose,
  onApply,
}: {
  row: ParseRow | null;
  students: CatalogStudent[];
  open: boolean;
  onClose: () => void;
  onApply: (student: CatalogStudent) => void;
}) {
  const [q, setQ] = useState("");
  const fuzzy = useMemo(
    () => (row ? bestFuzzyMatches(students, row.name || q, 5) : []),
    [row, students, q]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return students.slice(0, 20);
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          s.code.toLowerCase().includes(needle)
      )
      .slice(0, 20);
  }, [students, q]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Öğrenci eşleştir</DialogTitle>
        </DialogHeader>
        {row && (
          <p className="text-sm text-slate-600">
            Dosya: <strong>{row.name || "—"}</strong> · No: {row.no || "—"}
          </p>
        )}
        <Input
          placeholder="Ad veya numara ara…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mt-2"
        />
        {fuzzy.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
              Öneriler (benzerlik ≥ %55)
            </p>
            <ul className="space-y-1">
              {fuzzy.map(({ student, score }) => (
                <li key={student.id}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start py-2 text-left"
                    onClick={() => {
                      onApply(student);
                      onClose();
                    }}
                  >
                    {student.name} ({student.code}) — %{Math.round(score * 100)}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ul className="mt-3 max-h-[200px] space-y-1 overflow-y-auto">
          {filtered.map((s) => (
            <li key={s.id}>
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start py-2"
                onClick={() => {
                  onApply(s);
                  onClose();
                }}
              >
                {s.name} · {s.code}
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
