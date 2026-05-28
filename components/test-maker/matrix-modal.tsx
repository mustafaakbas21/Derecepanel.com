"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getSubjects, getTopics } from "@/lib/mufredat";
import { createMatrixExamKey, saveMatrixBundle } from "@/lib/test-maker/matrix-store";
import { tmToast } from "@/lib/test-maker/notify";
import type { MatrixQuestionRow } from "@/lib/test-maker/types";

type MatrixModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultName: string;
  questionCount: number;
  onSaved?: (examKey: string) => void;
};

export function MatrixModal({
  open,
  onOpenChange,
  defaultName,
  questionCount,
  onSaved,
}: MatrixModalProps) {
  const [count, setCount] = useState(Math.min(Math.max(questionCount, 1), 200));
  const [name, setName] = useState(defaultName);
  const [rows, setRows] = useState<MatrixQuestionRow[]>([]);
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(10);
  const [bulkDers, setBulkDers] = useState("");
  const [bulkKonu, setBulkKonu] = useState("");
  const subjects = getSubjects("ALL");

  useEffect(() => {
    if (!open) return;
    setCount(Math.min(Math.max(questionCount, 1), 200));
    setName(defaultName);
  }, [open, questionCount, defaultName]);

  useEffect(() => {
    if (!open) return;
    const sub = subjects[0];
    const top = sub ? getTopics(sub.id)[0] : undefined;
    setRows(
      Array.from({ length: count }, (_, i) => ({
        qNo: i + 1,
        subjectId: sub?.id ?? "",
        subjectName: sub?.name ?? "",
        topicId: top?.id ?? "",
        topicName: top?.name ?? "",
      }))
    );
  }, [count, open, subjects]);

  const applyRange = () => {
    const sub = subjects.find((s) => s.id === bulkDers);
    const top = getTopics(bulkDers).find((t) => t.id === bulkKonu);
    if (!sub || !top) return;
    setRows((prev) =>
      prev.map((r) =>
        r.qNo >= rangeFrom && r.qNo <= rangeTo
          ? {
              ...r,
              subjectId: sub.id,
              subjectName: sub.name,
              topicId: top.id,
              topicName: top.name,
            }
          : r
      )
    );
  };

  const save = () => {
    const filled = rows.filter((r) => r.subjectId && r.topicId).length;
    const examKey = createMatrixExamKey();
    saveMatrixBundle({
      examKey,
      name: name.trim() || "Tarama",
      date: new Date().toISOString().slice(0, 10),
      questions: rows,
      savedAt: new Date().toISOString(),
    });
    tmToast.matrixSaved(filled, rows.length);
    onSaved?.(examKey);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Matrix (soru – ders – konu)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="tm-config-label">Sınav adı</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="tm-config-label">Soru sayısı</label>
              <Input
                type="number"
                min={1}
                max={200}
                value={count}
                onChange={(e) => setCount(Number(e.target.value) || 1)}
              />
            </div>
          </div>
          <div className="rounded-xl border bg-slate-50 p-3 text-xs">
            <p className="mb-2 font-semibold">Aralık atama</p>
            <div className="flex flex-wrap gap-2">
              <Input type="number" className="h-9 w-16" value={rangeFrom} onChange={(e) => setRangeFrom(Number(e.target.value))} />
              <span className="self-center">—</span>
              <Input type="number" className="h-9 w-16" value={rangeTo} onChange={(e) => setRangeTo(Number(e.target.value))} />
              <select className="h-9 rounded-lg border px-2" value={bulkDers} onChange={(e) => { setBulkDers(e.target.value); setBulkKonu(""); }}>
                <option value="">Ders</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select className="h-9 rounded-lg border px-2" value={bulkKonu} onChange={(e) => setBulkKonu(e.target.value)} disabled={!bulkDers}>
                <option value="">Konu</option>
                {bulkDers && getTopics(bulkDers).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <Button type="button" size="sm" variant="secondary" onClick={applyRange}>Uygula</Button>
            </div>
          </div>
          <div className="max-h-[35vh] overflow-y-auto rounded border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="px-2 py-1">No</th>
                  <th className="px-2 py-1">Ders</th>
                  <th className="px-2 py-1">Konu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.qNo} className="border-t">
                    <td className="px-2 py-1">{row.qNo}</td>
                    <td className="px-2 py-1">
                      <select
                        className="h-8 w-full max-w-[140px] rounded border px-1"
                        value={row.subjectId}
                        onChange={(e) => {
                          const sub = subjects.find((s) => s.id === e.target.value);
                          const t0 = getTopics(e.target.value)[0];
                          setRows((prev) =>
                            prev.map((r) =>
                              r.qNo === row.qNo
                                ? {
                                    ...r,
                                    subjectId: e.target.value,
                                    subjectName: sub?.name ?? "",
                                    topicId: t0?.id ?? "",
                                    topicName: t0?.name ?? "",
                                  }
                                : r
                            )
                          );
                        }}
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        className="h-8 w-full max-w-[160px] rounded border px-1"
                        value={row.topicId}
                        onChange={(e) => {
                          const top = getTopics(row.subjectId).find((t) => t.id === e.target.value);
                          setRows((prev) =>
                            prev.map((r) =>
                              r.qNo === row.qNo
                                ? { ...r, topicId: e.target.value, topicName: top?.name ?? "" }
                                : r
                            )
                          );
                        }}
                      >
                        {getTopics(row.subjectId).map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
          <Button className="bg-slate-900 text-white" onClick={save}>Matrix kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
