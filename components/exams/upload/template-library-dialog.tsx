"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Library } from "lucide-react";
import { toast } from "@/lib/notify";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseFmtText } from "@/lib/exams/fmt-parse";
import { clientAuthHeaders } from "@/lib/auth/require-coach";
import {
  fmtPut,
  loadParserTemplates,
  type FmtRecord,
} from "@/lib/exams/fmt-store";

export function TemplateLibraryDialog({
  open,
  onClose,
  onSelect,
  activeId,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  activeId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const t = await loadParserTemplates();
      setTemplates(t.map((x) => ({ id: x.id, label: x.label })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const uploadFmt = async (file: File) => {
    const text = await file.text();
    let fmt: FmtRecord;
    try {
      const res = await fetch("/api/optical-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...clientAuthHeaders() },
        body: JSON.stringify({ text, fileName: file.name }),
      });
      if (!res.ok) throw new Error("API");
      const data = (await res.json()) as { template?: FmtRecord };
      fmt = data.template || parseFmtText(text, file.name);
    } catch {
      fmt = parseFmtText(text, file.name);
    }

    if (!fmt.id) {
      fmt.id = `fmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    }
    if (!fmt.label) fmt.label = file.name.replace(/\.[^.]+$/, "") || "Yüklenen FMT";

    await fmtPut(fmt);
    toast.success(`"${fmt.label}" kaydedildi ve seçildi`);
    await refresh();
    onSelect(fmt.id);
    onClose();
  };

  const handleOpen = (o: boolean) => {
    if (!o) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Optik şablon kütüphanesi
          </DialogTitle>
        </DialogHeader>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => inputRef.current?.click()}
        >
          <FileUp className="mr-2 h-4 w-4" />
          .fmt dosyası yükle
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".fmt,.txt"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadFmt(f);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-slate-500">
          Yüklenen şablon IndexedDB kasasına yazılır ve otomatik seçilir (ESKİ FmtStore akışı).
        </p>
        <ul className="mt-1 max-h-[280px] space-y-1 overflow-y-auto">
          {loading && (
            <li className="px-2 py-6 text-center text-sm text-slate-500">Yükleniyor…</li>
          )}
          {!loading && templates.length === 0 && (
            <li className="px-2 py-6 text-center text-sm text-slate-500">
              Henüz şablon yok — .fmt yükleyin veya varsayılan TSV şablonunu kullanın.
            </li>
          )}
          {!loading &&
            templates.map((t) => (
              <li key={t.id}>
                <Button
                  type="button"
                  variant={activeId === t.id ? "primary" : "ghost"}
                  className="h-auto w-full justify-start py-2.5 text-left"
                  onClick={() => {
                    onSelect(t.id);
                    onClose();
                  }}
                >
                  {t.label}
                  {activeId === t.id ? (
                    <span className="ml-auto text-[10px] font-semibold uppercase opacity-80">
                      Aktif
                    </span>
                  ) : null}
                </Button>
              </li>
            ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
