"use client";

import { useMemo, useState } from "react";
import { toast } from "@/lib/notify";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrField, trInputClass } from "@/components/taramalar/tr-ui";
import { appendAssigned } from "@/lib/test-maker/fascicle";
import {
  buildFasciclePayloadFromTarama,
  validateFascicleAnswerKey,
} from "@/lib/taramalar/fascicle-bridge";
import type { TaramaRecord } from "@/lib/taramalar/types";
import { loadStudentsFull } from "@/lib/students/storage";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: TaramaRecord | null;
  onSent?: () => void;
};

export function SendFascicleDialog({ open, onOpenChange, record, onSent }: Props) {
  const students = useMemo(
    () => loadStudentsFull({ seedIfEmpty: true }).filter((s) => s.status === "aktif"),
    [open]
  );
  const [classFilter, setClassFilter] = useState("");
  const [studentId, setStudentId] = useState("");

  const classes = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.sinifBranch) set.add(s.sinifBranch);
    });
    return [...set].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!classFilter) return students;
    return students.filter((s) => s.sinifBranch === classFilter);
  }, [students, classFilter]);

  const handleSend = () => {
    if (!record) return;
    if (!studentId) {
      toast.error("Öğrenci seçin");
      return;
    }
    const payload = buildFasciclePayloadFromTarama(record);
    if (!validateFascicleAnswerKey(payload.answerKey)) {
      toast.error("Cevap anahtarı eksik — önce taramayı Test Maker'da tamamlayın");
      return;
    }
    const student = students.find((s) => s.ogrenciId === studentId);
    appendAssigned(studentId, {
      ...payload,
      template: payload.template ?? "",
      studentCode: student?.studentCode,
      source: "tarama_deposu_send",
    });
    toast.success(`"${payload.title}" öğrenci kütüphanesine gönderildi`);
    onOpenChange(false);
    onSent?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Öğrenciye gönder</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          <strong>{record?.name ?? "Tarama"}</strong> · {record?.questions?.length ?? 0} soru
        </p>
        <TrField label="Sınıf filtresi">
          <select
            className={trInputClass}
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setStudentId("");
            }}
          >
            <option value="">Tüm öğrenciler</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </TrField>
        <TrField label="Öğrenci">
          <select
            className={trInputClass}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Seçin…</option>
            {filteredStudents.map((s) => (
              <option key={s.ogrenciId} value={s.ogrenciId}>
                {s.name}
                {s.studentCode ? ` (${s.studentCode})` : ""}
              </option>
            ))}
          </select>
        </TrField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button type="button" variant="primary" onClick={handleSend}>
            Gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
