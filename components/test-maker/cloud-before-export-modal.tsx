"use client";

import { Cloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CloudBeforeExportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cloudAvailable: boolean;
  onConfirm: (uploadToCloud: boolean) => void;
};

export function CloudBeforeExportModal({
  open,
  onOpenChange,
  cloudAvailable,
  onConfirm,
}: CloudBeforeExportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" id="tm-cloud-export-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-slate-600" aria-hidden />
            İndirmeden önce buluta kaydet
          </DialogTitle>
          <DialogDescription className="text-left leading-relaxed text-slate-600">
            Testinizi bulutta saklayarak PDF deposundan ve tarama akışından sonradan
            ulaşabilirsiniz. İndirme işlemine geçmeden önce buluta yüklemek ister misiniz?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            type="button"
            variant="primary"
            className="w-full rounded-xl"
            disabled={!cloudAvailable}
            onClick={() => onConfirm(true)}
          >
            Buluta kaydet ve indir
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => onConfirm(false)}
          >
            Bulut olmadan indir
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-xl text-slate-600"
            onClick={() => onOpenChange(false)}
          >
            Vazgeç
          </Button>
        </DialogFooter>
        {!cloudAvailable && (
          <p className="-mt-2 text-center text-xs text-amber-700">
            Bulut yapılandırması aktif değil — yalnızca yerel indirme kullanılabilir.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
