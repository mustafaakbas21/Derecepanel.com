"use client";

import { FileCode2, ScanLine, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type UploadParseMode = "autonomous" | "fmt";

type UploadModeModalProps = {
  open: boolean;
  fileName: string;
  onClose: () => void;
  onSelect: (mode: UploadParseMode) => void;
};

export function UploadModeModal({ open, fileName, onClose, onSelect }: UploadModeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-6 py-5 text-left">
          <DialogTitle className="text-lg font-extrabold tracking-tight text-slate-900">
            Nasıl okuyalım?
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-slate-600">
            <span className="font-mono text-xs text-slate-700">{fileName}</span> için okuma yöntemi
            seçin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6 py-5">
          <button
            type="button"
            className={cn(
              "group flex w-full flex-col gap-2 rounded-xl border-2 border-slate-900 bg-slate-900 p-4 text-left text-white shadow-md transition",
              "hover:bg-slate-800"
            )}
            onClick={() => onSelect("autonomous")}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-bold">Otonom sütun eşleme</p>
                <p className="text-xs text-white/75">Önerilen · FMT gerekmez</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-white/80">
              Bitişik no+ad, sınıf/şube ve cevap bloklarını motor ayırır; sütunları onaylamanız
              yeterli.
            </p>
          </button>

          <button
            type="button"
            className="group flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
            onClick={() => onSelect("fmt")}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                <FileCode2 className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-bold text-slate-900">FMT / optik şablon</p>
                <p className="text-xs text-slate-500">Kayıtlı .fmt tanımı ile sabit kolon</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Kurumunuzun daha önce tanımladığı optik şablonu kullanır; satır uzunluğu ve alan
              konumları şablona bağlıdır.
            </p>
          </button>
        </div>

        <DialogFooter className="border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Vazgeç
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Küçük ikon — mod seçilmeden önce dropzone altında ipucu */
export function UploadModeHint() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
      <ScanLine className="h-3.5 w-3.5" aria-hidden />
      Yükleme sonrası otonom veya FMT şablon seçeneği sunulur
    </p>
  );
}
