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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSave: () => void;
};

export function TestMakerUnsavedLeaveDialog({
  open,
  onOpenChange,
  onDiscard,
  onSave,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kaydedilmemiş test</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              Test Oluşturucu&apos;da kaydedilmemiş değişiklikler var. Sayfadan ayrılmadan önce{" "}
              <strong>taramayı kaydettiğinizden</strong> emin olun.
            </span>
            <span className="block rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              Kaydetmeden çıkarsanız sorular ve düzen silinir.
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
            Taramayı kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
