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
import { TrField, trInputClass } from "@/components/taramalar/tr-ui";
import { mirrorMissingToLs } from "@/lib/taramalar/tarama-mirror";
import { taramaList } from "@/lib/taramalar/tarama-db";
import type { TaramaRecord } from "@/lib/taramalar/types";
import { fmtTaramaDate } from "@/lib/taramalar/depo-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (rec: TaramaRecord) => void;
};

export function TaramaDepoPickerModal({ open, onOpenChange, onSelect }: Props) {
  const [items, setItems] = useState<TaramaRecord[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    void taramaList().then((list) => {
      mirrorMissingToLs(list);
      setItems(list);
    });
  }, [open]);

  const filtered = items.filter((r) => {
    if (!q.trim()) return true;
    const hay = [r.name, r.ders, r.konu].join(" ").toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tarama deposundan seç</DialogTitle>
        </DialogHeader>
        <TrField label="Ara">
          <input
            className={trInputClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ad, ders, konu…"
          />
        </TrField>
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {!filtered.length ? (
            <p className="py-6 text-center text-sm text-slate-500">Kayıtlı tarama yok</p>
          ) : (
            filtered.map((rec) => (
              <button
                key={rec.id}
                type="button"
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left hover:bg-slate-50"
                onClick={() => {
                  onSelect(rec);
                  onOpenChange(false);
                }}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{rec.name}</p>
                  <p className="text-xs text-slate-500">
                    {rec.ders}
                    {rec.konu ? ` · ${rec.konu}` : ""} · {rec.questions?.length ?? 0} soru
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{fmtTaramaDate(rec.createdAt)}</span>
              </button>
            ))
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
