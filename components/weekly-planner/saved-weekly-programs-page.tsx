"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Printer,
  Pencil,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "@/lib/notify";

import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { useWeeklyPrint } from "@/components/weekly-planner/use-weekly-print";
import { Button } from "@/components/ui/button";
import { HAFTALIK_PROGRAM_ROUTES } from "@/lib/coach/haftalik-program-nav-config";
import { buildWeeklyPrintSnapshot } from "@/lib/weekly-planner/print-snapshot";
import {
  buildWeeklyProgramWhatsappText,
  deleteSavedWeeklyProgram,
  deliverWeeklyProgramToStudent,
  listSavedWeeklyPrograms,
  type SavedWeeklyProgram,
  upsertSavedWeeklyProgram,
} from "@/lib/weekly-planner/saved-programs";
import {
  WEEKLY_PROGRAM_SAVED_CHANGE,
} from "@/lib/weekly-planner/constants";
import { mondayOf } from "@/lib/weekly-planner/week-utils";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: SavedWeeklyProgram["status"] }) {
  const sent = status === "gonderildi";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        sent ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
      )}
    >
      {sent ? "Gönderildi" : "Kayıtlı"}
    </span>
  );
}

function ProgramRow({
  program,
  onPrint,
  onSend,
  onDelete,
  printLoadingId,
}: {
  program: SavedWeeklyProgram;
  onPrint: (p: SavedWeeklyProgram) => void;
  onSend: (p: SavedWeeklyProgram) => void;
  onDelete: (program: SavedWeeklyProgram) => void;
  printLoadingId: string | null;
}) {
  const updated = new Date(program.updatedAt).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <li className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-900">{program.studentName}</p>
          <StatusBadge status={program.status} />
        </div>
        <p className="mt-0.5 text-sm text-slate-600">{program.weekRangeLabel}</p>
        <p className="mt-1 text-xs text-slate-400">
          {program.tasks.length} görev · Güncellendi {updated}
          {program.sentAt
            ? ` · Gönderim ${new Date(program.sentAt).toLocaleDateString("tr-TR")}`
            : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
          <Link href={`${HAFTALIK_PROGRAM_ROUTES.olusturucu}?program=${program.id}`}>
            <Pencil className="h-3.5 w-3.5" />
            Düzenle
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          disabled={printLoadingId === program.id}
          onClick={() => onPrint(program)}
        >
          {printLoadingId === program.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Printer className="h-3.5 w-3.5" />
          )}
          Yazdır
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => onSend(program)}
        >
          <Send className="h-3.5 w-3.5" />
          Öğrenciye yolla
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-rose-600"
          title="Sil"
          onClick={() => onDelete(program)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

export function SavedWeeklyProgramsPage() {
  const { confirm, ConfirmHost } = useConfirm();
  const [programs, setPrograms] = useState<SavedWeeklyProgram[]>([]);
  const [query, setQuery] = useState("");
  const [printLoadingId, setPrintLoadingId] = useState<string | null>(null);
  const { printing, openPrintPreview } = useWeeklyPrint();

  const refresh = useCallback(() => {
    setPrograms(listSavedWeeklyPrograms());
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(WEEKLY_PROGRAM_SAVED_CHANGE, onChange);
    return () => window.removeEventListener(WEEKLY_PROGRAM_SAVED_CHANGE, onChange);
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (!q) return programs;
    return programs.filter(
      (p) =>
        p.studentName.toLocaleLowerCase("tr-TR").includes(q) ||
        p.weekRangeLabel.toLocaleLowerCase("tr-TR").includes(q) ||
        p.title.toLocaleLowerCase("tr-TR").includes(q)
    );
  }, [programs, query]);

  const handlePrint = async (program: SavedWeeklyProgram) => {
    setPrintLoadingId(program.id);
    try {
      const weekMonday = mondayOf(new Date(`${program.weekMondayISO}T12:00:00`));
      const snapshot = buildWeeklyPrintSnapshot(
        {
          name: program.studentName,
          sinifBranch: "",
          alan: "sayisal",
          goal: "",
        },
        weekMonday,
        program.tasks
      );
      const title = `${program.title} — yazdır`;
      const ok = await openPrintPreview(snapshot, title);
      if (ok) toast.success("Yazdırma önizlemesi açıldı");
      else toast.error("Önizleme açılamadı");
    } finally {
      setPrintLoadingId(null);
    }
  };

  const handleSend = (program: SavedWeeklyProgram) => {
    deliverWeeklyProgramToStudent(program);
    const updated = upsertSavedWeeklyProgram({
      ...program,
      status: "gonderildi",
      sentAt: new Date().toISOString(),
    });
    refresh();
    const text = buildWeeklyProgramWhatsappText(updated);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
    toast.success("Program öğrenci kutusuna eklendi · WhatsApp açıldı");
  };

  const handleDeleteRequest = async (program: SavedWeeklyProgram) => {
    const ok = await confirm({
      title: `"${program.title}" silinsin mi?`,
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    if (deleteSavedWeeklyProgram(program.id)) {
      toast.success("Program silindi");
      refresh();
    }
  };

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Kayıtlı Haftalık Programlar"
        description="Kaydettiğiniz planları düzenleyin, yazdırın veya öğrenciye gönderin."
        action={
          <Button variant="primary" asChild>
            <Link href={HAFTALIK_PROGRAM_ROUTES.olusturucu}>Yeni program oluştur</Link>
          </Button>
        }
      />

      <section className={LIBRARY_PANEL_CLASS}>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm font-medium text-slate-700">
            {filtered.length} program
            {query.trim() ? " (filtrelenmiş)" : ""}
          </p>
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Öğrenci veya hafta ara…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-900 outline-none ring-slate-300 focus:border-slate-300 focus:ring-2"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-slate-400">
              <CalendarDays className="h-6 w-6" strokeWidth={2} />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-900">
              {programs.length === 0 ? "Henüz kayıtlı program yok" : "Sonuç bulunamadı"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {programs.length === 0
                ? "Otonom planlayıcıda programı hazırlayıp «Programı kaydet» ile arşive alın."
                : "Arama kriterini değiştirin."}
            </p>
            {programs.length === 0 ? (
              <Button variant="primary" className="mt-6" asChild>
                <Link href={HAFTALIK_PROGRAM_ROUTES.olusturucu}>Program oluştur</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <ProgramRow
                key={p.id}
                program={p}
                onPrint={handlePrint}
                onSend={handleSend}
                onDelete={handleDeleteRequest}
                printLoadingId={printLoadingId}
              />
            ))}
          </ul>
        )}
      </section>
      {ConfirmHost}
    </div>
  );
}
