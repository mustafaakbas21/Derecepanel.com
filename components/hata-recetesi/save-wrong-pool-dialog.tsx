"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HataKaynagiToggle } from "@/components/hata-recetesi/hata-kaynagi-toggle";
import type { HataKaynagi } from "@/lib/hata-recetesi/types";

type Props = {
  open: boolean;
  count: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: (kaynak: HataKaynagi) => void;
};

export function SaveWrongPoolDialog({ open, count, onOpenChange, onConfirm }: Props) {
  const [deneme, setDeneme] = useState(true);
  const [soruBankasi, setSoruBankasi] = useState(false);

  const confirm = () => {
    const kaynak: HataKaynagi =
      !deneme && soruBankasi ? "soru_bankasi" : "deneme";
    onConfirm(kaynak);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reçete havuzuna kaydet</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          <strong>{count}</strong> soru hatalı havuza eklenecek. Kaynağı işaretleyin:
        </p>
        <HataKaynagiToggle
          deneme={deneme}
          soruBankasi={soruBankasi}
          onChange={({ deneme: d, soru_bankasi: s }) => {
            setDeneme(d);
            setSoruBankasi(s);
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={confirm}>
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
