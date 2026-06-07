"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "@/lib/notify";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hrInputClass } from "@/components/hata-recetesi/hr-ui";
import { loadStudentRows } from "@/lib/hata-recetesi/students";
import type { RecipeArchiveRecord } from "@/lib/hata-recetesi/types";
import { appendAssigned } from "@/lib/test-maker/fascicle";

type Props = {
  rec: RecipeArchiveRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SendToStudentModal({ rec, open, onOpenChange }: Props) {
  const rows = useMemo(() => loadStudentRows(), []);
  const [ogrenciId, setOgrenciId] = useState("");

  const handleSend = () => {
    if (!rec || !ogrenciId) {
      toast.error("Öğrenci seçin");
      return;
    }
    const row = rows.find((r) => r.ogrenciId === ogrenciId);
    appendAssigned(ogrenciId, {
      title: rec.name,
      questionCount: rec.questionCount,
      answerKey: rec.answerKey,
      template: rec.template ?? "derece",
      studentCode: row?.studentCode,
      pdf_file_id: rec.pdf_file_id,
      id: `recete-${rec.id}`,
    });
    toast.success("Öğrenci kütüphanesine gönderildi", {
      description: `${rec.name} · ${rec.questionCount} soru`,
    });
    onOpenChange(false);
    setOgrenciId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Öğrenciye gönder</DialogTitle>
        </DialogHeader>
        {rec ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-900">{rec.name}</p>
            <p className="mt-0.5 text-slate-500">
              {rec.questionCount} soru · {rec.ders}
              {rec.konu ? ` · ${rec.konu}` : ""}
            </p>
          </div>
        ) : null}
        <select
          className={hrInputClass}
          value={ogrenciId}
          onChange={(e) => setOgrenciId(e.target.value)}
        >
          <option value="">Öğrenci seçin…</option>
          {rows.map((r) => (
            <option key={r.ogrenciId} value={r.ogrenciId}>
              {r.label}
            </option>
          ))}
        </select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleSend}>
            <Send className="h-4 w-4" />
            Gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
