"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SaveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  weekLabel: string;
  taskCount: number;
  openPrintAfterSave: boolean;
  onOpenPrintAfterSaveChange: (v: boolean) => void;
  onConfirm: () => void;
  saving?: boolean;
};

export function WeeklySaveProgramDialog({
  open,
  onOpenChange,
  studentName,
  weekLabel,
  taskCount,
  openPrintAfterSave,
  onOpenPrintAfterSaveChange,
  onConfirm,
  saving,
}: SaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Programı kaydet</DialogTitle>
          <DialogDescription>
            <strong>{studentName}</strong> · {weekLabel} · {taskCount} görev arşive eklenecek.
            Kaydettikten sonra listeden düzenleyebilir, yazdırabilir ve öğrenciye
            gönderebilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
            checked={openPrintAfterSave}
            onChange={(e) => onOpenPrintAfterSaveChange(e.target.checked)}
          />
          <span>
            Kaydettikten sonra <strong>yazdırma önizlemesini aç</strong> (A4 yatay)
          </span>
        </label>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button type="button" variant="primary" disabled={saving} onClick={onConfirm}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ResetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekLabel: string;
  onConfirm: () => void;
};

type LeaveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSave: () => void;
};

export function WeeklyUnsavedLeaveDialog({
  open,
  onOpenChange,
  onDiscard,
  onSave,
}: LeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kaydedilmemiş program</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              Bu haftanın programında kaydedilmemiş değişiklikler var. Sayfadan ayrılmadan önce{" "}
              <strong>programı kaydettiğinizden</strong> emin olun.
            </span>
            <span className="block rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              Kaydetmeden çıkarsanız görevler silinir.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button type="button" variant="outline" onClick={onDiscard}>
            Kaydetmeden çık
          </Button>
          <Button type="button" variant="primary" onClick={onSave}>
            Programı kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WeeklyResetProgramDialog({
  open,
  onOpenChange,
  weekLabel,
  onConfirm,
}: ResetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Programı sıfırla</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              <strong>{weekLabel}</strong> için tüm görevler silinecek. Bu işlem geri alınamaz.
            </span>
            <span className="block rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              Devam etmeden önce programı <strong>kaydettiğinizden</strong> ve gerekirse{" "}
              <strong>yazdırdığınızdan</strong> emin olun.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Evet, sıfırla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
