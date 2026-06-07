"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, FileText, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatPdfDeposuSize,
  pdfDeposuAdd,
  pdfDeposuDelete,
  pdfDeposuGetFile,
  pdfDeposuList,
  pdfDeposuTotalSize,
  type PdfDeposuMeta,
} from "@/lib/test-maker/pdf-deposu-db";
import { tmToast } from "@/lib/test-maker/notify";
import { cn } from "@/lib/utils";

type PdfDeposuDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseInWorkspace: (file: File) => void;
};

export function PdfDeposuDialog({
  open,
  onOpenChange,
  onUseInWorkspace,
}: PdfDeposuDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PdfDeposuMeta[]>([]);
  const [totalBytes, setTotalBytes] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, total] = await Promise.all([pdfDeposuList(), pdfDeposuTotalSize()]);
      setItems(list);
      setTotalBytes(total);
    } catch {
      tmToast.error("PDF deposu okunamadı");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const ingestFiles = async (list: FileList | File[]) => {
    for (const f of Array.from(list)) {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) continue;
      try {
        await pdfDeposuAdd(f);
        tmToast.success(`${f.name} depoya eklendi`);
      } catch (e) {
        if ((e as Error).message === "too_large") {
          tmToast.error("Dosya çok büyük (maks. 150 MB)");
        } else {
          tmToast.error("Depoya kaydedilemedi");
        }
      }
    }
    await refresh();
  };

  const useFile = async (id: string) => {
    const file = await pdfDeposuGetFile(id);
    if (!file) {
      tmToast.error("PDF bulunamadı");
      return;
    }
    onUseInWorkspace(file);
    onOpenChange(false);
  };

  const remove = async (id: string) => {
    try {
      await pdfDeposuDelete(id);
      await refresh();
    } catch {
      tmToast.error("Silinemedi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden p-0" id="pdf-deposu-modal">
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <Archive className="h-5 w-5 text-slate-600" />
            </span>
            <div className="min-w-0">
              <DialogTitle>PDF Deposu</DialogTitle>
              <DialogDescription>
                Tarayıcınızda saklanan kütüphane · {items.length} dosya ·{" "}
                {formatPdfDeposuSize(totalBytes)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void ingestFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="space-y-4 overflow-y-auto px-6 py-4">
          <div
            role="button"
            tabIndex={0}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center transition hover:border-slate-400 hover:bg-white"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.length) void ingestFiles(e.dataTransfer.files);
            }}
          >
            <Upload className="h-6 w-6 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">
              Yeni PDF için sürükleyin veya tıklayın
            </p>
            <p className="text-xs text-slate-500">Maks. 150 MB · IndexedDB</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kayıtlı dosyalar
              </h4>
              {loading ? (
                <span className="text-[10px] text-slate-400">Yükleniyor…</span>
              ) : null}
            </div>

            {items.length === 0 ? (
              <div
                id="pdf-deposu-empty"
                className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500"
              >
                Depoda PDF yok. Yukarıdan yükleyerek başlayın.
              </div>
            ) : (
              <ul id="pdf-deposu-list" className="max-h-[40vh] space-y-2 overflow-y-auto">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {formatPdfDeposuSize(item.size)} ·{" "}
                        {new Date(item.addedAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="h-8 shrink-0 rounded-lg px-2.5 text-[11px]"
                      onClick={() => void useFile(item.id)}
                    >
                      Kullan
                    </Button>
                    <button
                      type="button"
                      className={cn(
                        "shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500",
                        "hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      )}
                      aria-label="Sil"
                      onClick={() => void remove(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-3">
          <Button
            id="close-pdf-deposu"
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
