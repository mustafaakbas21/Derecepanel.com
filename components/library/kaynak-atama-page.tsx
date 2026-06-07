"use client";

import { useEffect, useMemo, useState } from "react";
import { BookMarked, ChevronRight, Search, UserCheck, Users } from "lucide-react";

import { StudentAssignDialog } from "@/components/library/student-assign-dialog";
import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LIBRARY_PANEL_INNER,
  LibraryEmptyState,
  LibraryFilterBar,
  LibraryInsights,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import "@/components/library/library.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLibrary } from "@/hooks/use-library";
import {
  FIELD_BADGE,
  FIELD_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  getInitials,
} from "@/lib/students/constants";
import { loadStudentsFull } from "@/lib/students/storage";
import { normalizeStudyField } from "@/lib/students/normalize-field";
import type { StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

import { takeHandoff } from "@/lib/panel-store/handoff";

const HANDOFF_KEY = "aktarilanOgrenci";

export function KaynakAtamaPage() {
  const { assignments, books, hydrated: libHydrated } = useLibrary();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<StudentRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setStudents(loadStudentsFull());
    try {
      const raw = takeHandoff(HANDOFF_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { ogrenciId?: string; id?: string };
      const id = data.ogrenciId ?? data.id;
      if (!id) return;
      const st = loadStudentsFull().find((s) => s.ogrenciId === id);
      if (st) {
        setSelected(st);
        setDialogOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const assignmentCountByStudent = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assignments) {
      map.set(a.studentId, (map.get(a.studentId) ?? 0) + 1);
    }
    return map;
  }, [assignments]);

  const studentsWithBooks = useMemo(
    () => assignmentCountByStudent.size,
    [assignmentCountByStudent]
  );

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === "aktif" || s.status === "donduruldu"),
    [students]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeStudents
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.goal.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [activeStudents, search]);

  const openStudent = (st: StudentRecord) => {
    setSelected(st);
    setDialogOpen(true);
  };

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Kaynak Atama"
        description="Öğrenci satırına tıklayın; mevcut kaynakları yönetin ve kütüphaneden yeni kitap atayın."
        meta={`${books.length} kitap · ${assignments.length} atama`}
      />

      <LibraryInsights
        metrics={[
          {
            label: "Kayıtlı öğrenci",
            value: activeStudents.length,
            sub: "Aktif + dondurulmuş",
            icon: Users,
          },
          {
            label: "Kaynaklı öğrenci",
            value: studentsWithBooks,
            sub: "En az 1 atama",
            icon: UserCheck,
          },
          {
            label: "Kütüphane",
            value: books.length,
            icon: BookMarked,
          },
          {
            label: "Toplam atama",
            value: assignments.length,
            icon: BookMarked,
          },
        ]}
      />

      <section className={LIBRARY_PANEL_CLASS} aria-label="Öğrenci listesi">
        <div className={LIBRARY_PANEL_INNER}>
          <LibraryFilterBar
            trailing={
              filtered.length === activeStudents.length
                ? `${activeStudents.length} öğrenci`
                : `${filtered.length} / ${activeStudents.length} öğrenci`
            }
          >
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-11 border-slate-200 bg-slate-50/50 pl-9"
                placeholder="Ad, öğrenci kodu veya hedef ara…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </LibraryFilterBar>

          {!libHydrated && students.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">Yükleniyor…</p>
          ) : filtered.length === 0 ? (
            <LibraryEmptyState
              title={students.length === 0 ? "Henüz öğrenci yok" : "Sonuç bulunamadı"}
              description={
                students.length === 0
                  ? "Önce Öğrencilerim sayfasından kayıt ekleyin."
                  : "Arama kriterinize uygun öğrenci bulunamadı."
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Öğrenci
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Kod
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Sınıf
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Alan
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Durum
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Kaynak
                    </th>
                    <th className="w-10 px-2 py-3" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((st) => {
                    const count = assignmentCountByStudent.get(st.ogrenciId) ?? 0;
                    const alan = normalizeStudyField(st.alan);
                    return (
                      <tr
                        key={st.ogrenciId}
                        className="lib-student-row border-b border-slate-50 transition-colors hover:bg-slate-50/80"
                        onClick={() => openStudent(st)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openStudent(st);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                              {getInitials(st.name)}
                            </span>
                            <span className="font-medium text-slate-900">{st.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                          {st.studentCode}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{st.sinifBranch}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                              FIELD_BADGE[alan]
                            )}
                          >
                            {FIELD_LABELS[alan]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                              STATUS_STYLES[st.status]
                            )}
                          >
                            {STATUS_LABELS[st.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span
                            className={cn(
                              "text-base font-bold tabular-nums",
                              count > 0 ? "text-slate-900" : "text-slate-300"
                            )}
                          >
                            {count}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 text-slate-400">
                          <ChevronRight className="h-4 w-4" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <StudentAssignDialog
        student={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
