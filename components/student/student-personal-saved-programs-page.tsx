"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Pencil, Printer, Search, Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "@/lib/notify";

import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { useWeeklyPrint } from "@/components/weekly-planner/use-weekly-print";
import { Button } from "@/components/ui/button";
import { buildWeeklyPrintSnapshot } from "@/lib/weekly-planner/print-snapshot";
import {
  deleteStudentPersonalWeeklyProgram,
  listStudentPersonalWeeklyPrograms,
  type StudentPersonalWeeklyProgram,
} from "@/lib/weekly-planner/student-personal-programs";
import { STUDENT_PERSONAL_WEEKLY_CHANGE } from "@/lib/weekly-planner/constants";
import { resolveStudentTrackingId } from "@/lib/konu-takip/student-scope";
import { getCurrentUser } from "@/lib/weekly-planner/student-scope";
import { STUDENT_HAFTALIK_PROGRAM_ROUTES } from "@/lib/student/sidebar-nav-config";
import { mondayOf } from "@/lib/weekly-planner/week-utils";
import { cn } from "@/lib/utils";

function ProgramRow({
  program,
  onPrint,
  onDelete,
  printLoadingId,
}: {
  program: StudentPersonalWeeklyProgram;
  onPrint: (p: StudentPersonalWeeklyProgram) => void;
  onDelete: (program: StudentPersonalWeeklyProgram) => void;
  printLoadingId: string | null;
}) {
  const updated = new Date(program.updatedAt).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <li className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{program.weekRangeLabel}</p>
        <p className="mt-1 text-xs text-slate-400">
          {program.tasks.length} görev · Güncellendi {updated}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
          <Link
            href={`${STUDENT_HAFTALIK_PROGRAM_ROUTES.bireysel}?program=${program.id}`}
          >
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

export function StudentPersonalSavedProgramsPage() {
  const router = useRouter();
  const { confirm, ConfirmHost } = useConfirm();
  const [programs, setPrograms] = useState<StudentPersonalWeeklyProgram[]>([]);
  const [query, setQuery] = useState("");
  const [printLoadingId, setPrintLoadingId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const { openPrintPreview } = useWeeklyPrint();

  const studentId = useMemo(() => resolveStudentTrackingId(getCurrentUser()), []);

  const refresh = useCallback(() => {
    setPrograms(listStudentPersonalWeeklyPrograms(studentId));
    setHydrated(true);
  }, [studentId]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/");
      return;
    }
    refresh();
    const onChange = () => refresh();
    window.addEventListener(STUDENT_PERSONAL_WEEKLY_CHANGE, onChange);
    return () => window.removeEventListener(STUDENT_PERSONAL_WEEKLY_CHANGE, onChange);
  }, [refresh, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter(
      (p) =>
        p.weekRangeLabel.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.weekMondayISO.includes(q)
    );
  }, [programs, query]);

  const handlePrint = async (program: StudentPersonalWeeklyProgram) => {
    setPrintLoadingId(program.id);
    try {
      const weekMonday = mondayOf(new Date(`${program.weekMondayISO}T12:00:00`));
      const snapshot = buildWeeklyPrintSnapshot(
        {
          name: program.studentName,
          sinifBranch: "",
          alan: "tyt",
          goal: "",
        },
        weekMonday,
        program.tasks
      );
      const title = `Haftalık program — ${program.studentName} — ${program.weekRangeLabel}`;
      const ok = await openPrintPreview(snapshot, title);
      if (ok) toast.success("Yazdırma önizlemesi açıldı");
      else toast.error("Önizleme açılamadı");
    } finally {
      setPrintLoadingId(null);
    }
  };

  const handleDelete = async (program: StudentPersonalWeeklyProgram) => {
    const ok = await confirm({
      title: "Program silinsin mi?",
      description: `${program.weekRangeLabel} haftasına ait program kalıcı olarak silinir.`,
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    if (deleteStudentPersonalWeeklyProgram(program.id)) {
      toast.success("Program silindi");
      refresh();
    }
  };

  if (!hydrated) {
    return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  }

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      {ConfirmHost}
      <LibraryPageHeader
        title="Kayıtlı Bireysel Programlarım"
        description="Kendi oluşturduğunuz haftalık programların arşivi. Düzenlemek için programı açın."
        meta={`${programs.length} kayıtlı program`}
        action={
          <Button variant="primary" size="sm" asChild>
            <Link href={STUDENT_HAFTALIK_PROGRAM_ROUTES.bireysel}>Yeni program oluştur</Link>
          </Button>
        }
      />

      <section className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}>
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Hafta veya tarih ara…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "#fff7ed" }}
            >
              <CalendarDays className="h-8 w-8 text-orange-500" strokeWidth={2} />
            </div>
            <p className="text-lg font-bold text-slate-900">
              {programs.length === 0 ? "Henüz kayıtlı program yok" : "Sonuç bulunamadı"}
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              {programs.length === 0
                ? "Bireysel haftalık program oluşturucudan program kaydettiğinizde burada listelenir."
                : "Arama kriterlerinize uygun program bulunamadı."}
            </p>
            {programs.length === 0 ? (
              <Button variant="primary" className="mt-6" asChild>
                <Link href={STUDENT_HAFTALIK_PROGRAM_ROUTES.bireysel}>Program oluştur</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <ul>{filtered.map((p) => (
            <ProgramRow
              key={p.id}
              program={p}
              onPrint={handlePrint}
              onDelete={handleDelete}
              printLoadingId={printLoadingId}
            />
          ))}</ul>
        )}
      </section>
    </div>
  );
}
