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

type ResetModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function ResetModal({ open, onOpenChange, onConfirm }: ResetModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" id="tm-reset-modal">
        <DialogHeader>
          <DialogTitle>Stüdyoyu sıfırla</DialogTitle>
          <DialogDescription>
            Tüm sorular, sayfa düzeni ve taslak ayarlar silinir. Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            id="tm-reset-cancel"
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
          <Button
            id="tm-reset-confirm"
            type="button"
            variant="destructive"
            className="rounded-xl"
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
