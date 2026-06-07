"use client";

import { useCallback, useEffect, useState } from "react";
import { ListOrdered, Printer } from "lucide-react";
import { toast } from "@/lib/notify";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TercihSortableList } from "@/components/yks-sim/tercih-sortable-list";
import { TercihStudentPicker } from "@/components/yks-sim/tercih-student-picker";
import { openTercihListPrintPreview } from "@/lib/yks-sim/tercih-print";
import {
  loadActiveStudentsForTercih,
  resolveTercihSimUser,
  saveSelectedTercihStudentId,
} from "@/lib/yks-sim/tercih-student";
import { useConfirm } from "@/hooks/use-confirm";
import {
  clearTercihList,
  readTercihList,
  TERCIH_LIST_CHANGE,
  type TercihListItem,
} from "@/lib/yks-sim/tercih-list-storage";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onListChange?: () => void;
  mode?: "coach" | "student";
  selectedStudentId: string;
  onSelectedStudentIdChange: (ogrenciId: string) => void;
};

export function TercihListModal({
  open,
  onOpenChange,
  onListChange,
  mode = "coach",
  selectedStudentId,
  onSelectedStudentIdChange,
}: Props) {
  const [items, setItems] = useState<TercihListItem[]>([]);
  const [printing, setPrinting] = useState(false);
  const students = loadActiveStudentsForTercih();
  const simUser = resolveTercihSimUser(mode, selectedStudentId);
  const { confirm, ConfirmHost } = useConfirm();

  const refresh = useCallback(() => {
    const u = resolveTercihSimUser(mode, selectedStudentId);
    setItems(readTercihList(u));
    onListChange?.();
  }, [onListChange, mode, selectedStudentId]);

  useEffect(() => {
    if (!open) return;
    refresh();
    const onChange = () => refresh();
    window.addEventListener(TERCIH_LIST_CHANGE, onChange);
    return () => window.removeEventListener(TERCIH_LIST_CHANGE, onChange);
  }, [open, refresh]);

  const handlePrint = () => {
    if (!items.length) {
      toast.message("Liste boş");
      return;
    }
    setPrinting(true);
    try {
      const ok = openTercihListPrintPreview(
        {
          items,
          studentName: simUser?.name,
        },
        "Tercih listesi"
      );
      if (ok) {
        toast.success("Yazdırma önizlemesi açıldı — A4 yatay, PDF olarak kaydedebilirsiniz");
      } else {
        toast.error("Pop-up engellendi — yeni sekme izni verin");
      }
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,900px)] w-[min(96vw,1680px)] !max-w-[min(96vw,1680px)] sm:!max-w-[min(96vw,1680px)] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ListOrdered className="h-5 w-5 text-slate-700" />
            Tercih listesi
          </DialogTitle>
          <DialogDescription>
            Üniversite tercih sıranızı burada düzenleyin. Sürükleyerek sıralayın — 1. sıra birincil
            hedefiniz olarak kaydedilir.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-3 sm:px-6">
          {mode === "coach" ? (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <TercihStudentPicker
                students={students}
                value={selectedStudentId}
                onChange={(id) => {
                  onSelectedStudentIdChange(id);
                  saveSelectedTercihStudentId(id);
                }}
              />
            </div>
          ) : null}

          {!simUser && mode === "coach" ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-6 text-center">
              <p className="font-semibold text-amber-950">Öğrenci seçilmedi</p>
              <p className="mt-1 text-sm text-amber-800">
                Tercih listesini görüntülemek ve düzenlemek için yukarıdan bir öğrenci seçin.
              </p>
            </div>
          ) : !items.length ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center">
              <p className="font-semibold text-slate-800">Liste henüz boş</p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Tablodan programlara <strong>Tercih listesine ekle</strong> ile ekleyin.
              </p>
            </div>
          ) : simUser ? (
            <TercihSortableList
              items={items}
              simUser={simUser}
              onChange={refresh}
              variant="table"
            />
          ) : null}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!items.length || !simUser}
              onClick={async () => {
                const ok = await confirm({
                  title: "Tercih listesi temizlensin mi?",
                  description:
                    "Seçili öğrencinin tüm tercih kayıtları silinir. Bu işlem geri alınamaz.",
                  confirmLabel: "Evet, temizle",
                  destructive: true,
                });
                if (!ok || !simUser) return;
                if (clearTercihList(simUser)) {
                  toast.success("Liste temizlendi");
                  refresh();
                }
              }}
            >
              Listeyi temizle
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Kapat
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!items.length || printing || !simUser}
              onClick={handlePrint}
            >
              <Printer className="mr-1.5 h-4 w-4" />
              {printing ? "Hazırlanıyor…" : "PDF ile yazdır"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      {ConfirmHost}
    </Dialog>
  );
}
