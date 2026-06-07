"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  CalendarClock,
  Loader2,
  Search,
  TrendingUp,
} from "lucide-react";

import { StudentAssignedBookCard } from "@/components/student/student-assigned-book-card";
import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LIBRARY_PANEL_INNER,
  LibraryEmptyState,
  LibraryFilterBar,
  LibraryInsights,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentLibrary } from "@/hooks/use-student-library";
import { bookSearchHaystack } from "@/lib/library/book-meta";
import { BOOK_KIND_LABELS } from "@/lib/library/constants";
import type { BookKind } from "@/lib/library/types";
import { STUDENT_KITAP_ROUTES } from "@/lib/student/sidebar-nav-config";
import { getSubjects } from "@/lib/mufredat";

type StatusFilter = "all" | "active" | "completed" | "overdue";

export function StudentAssignedBooksPage() {
  const { assignments, stats, coachName, hydrated } = useStudentLibrary();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<BookKind | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const subjects = useMemo(() => getSubjects(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return assignments.filter((item) => {
      const book = item.book;
      if (!book) return statusFilter === "all";

      if (kindFilter !== "all" && book.kind !== kindFilter) return false;
      if (subjectFilter !== "all" && book.subjectId !== subjectFilter) return false;

      if (statusFilter === "completed" && item.progress < 100) return false;
      if (statusFilter === "active" && (item.progress <= 0 || item.progress >= 100)) return false;
      if (statusFilter === "overdue") {
        if (!item.dueDate || item.progress >= 100) return false;
        const t = Date.parse(`${item.dueDate}T00:00:00`);
        if (Number.isNaN(t) || t >= now.getTime()) return false;
      }

      if (!q) return true;
      return bookSearchHaystack(book).includes(q) || (item.note ?? "").toLowerCase().includes(q);
    });
  }, [assignments, kindFilter, search, statusFilter, subjectFilter]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Atanan Kitaplar"
        description="Koçunuzun kütüphaneden size atadığı kitap ve kaynakları burada görürsünüz. İlerlemenizi güncellemek için Kitap ilerlemem sayfasını kullanın."
        meta={
          coachName
            ? `Koçunuz: ${coachName} · ${stats.total} kaynak`
            : stats.total
              ? `${stats.total} kaynak`
              : undefined
        }
        action={
          stats.total > 0 ? (
            <Button variant="primary" asChild>
              <Link href={STUDENT_KITAP_ROUTES.ilerleme}>Kitap ilerlemem</Link>
            </Button>
          ) : null
        }
      />

      {stats.total > 0 ? (
        <LibraryInsights
          metrics={[
            {
              label: "Toplam kaynak",
              value: stats.total,
              sub: "Koç ataması",
              icon: BookMarked,
            },
            {
              label: "Ortalama ilerleme",
              value: `%${stats.avgProgress}`,
              sub: `${stats.inProgress} devam ediyor`,
              icon: TrendingUp,
            },
            {
              label: "Tamamlanan",
              value: stats.completed,
              sub: stats.notStarted ? `${stats.notStarted} başlanmadı` : "Harika gidiyorsun",
              icon: BookOpen,
            },
            {
              label: "Yaklaşan teslim",
              value: stats.dueSoon,
              sub: stats.overdue ? `${stats.overdue} gecikmiş` : "7 gün içinde",
              icon: stats.overdue ? AlertCircle : CalendarClock,
            },
          ]}
        />
      ) : null}

      <div className={LIBRARY_PANEL_CLASS} style={{ boxShadow: "var(--card-shadow-sm)" }}>
        <div className={LIBRARY_PANEL_INNER}>
          {stats.total === 0 ? (
            <LibraryEmptyState
              title="Henüz atanan kaynak yok"
              description="Koçunuz kütüphaneden size kitap veya soru bankası atadığında burada listelenecek. Atamalar anında senkronize olur."
            />
          ) : (
            <>
              <LibraryFilterBar trailing={`${filtered.length} / ${stats.total} kaynak`}>
                <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Kitap veya yayınevi ara…"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={kindFilter}
                  onValueChange={(v) => setKindFilter(v as BookKind | "all")}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Tür" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm türler</SelectItem>
                    {(Object.keys(BOOK_KIND_LABELS) as BookKind[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {BOOK_KIND_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Ders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm dersler</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm durumlar</SelectItem>
                    <SelectItem value="active">Devam eden</SelectItem>
                    <SelectItem value="completed">Tamamlanan</SelectItem>
                    <SelectItem value="overdue">Gecikmiş</SelectItem>
                  </SelectContent>
                </Select>
              </LibraryFilterBar>

              {filtered.length === 0 ? (
                <LibraryEmptyState
                  title="Filtreye uygun kaynak yok"
                  description="Arama veya filtreleri değiştirerek tekrar deneyin."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setKindFilter("all");
                        setSubjectFilter("all");
                        setStatusFilter("all");
                      }}
                    >
                      Filtreleri temizle
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((item) => (
                    <StudentAssignedBookCard
                      key={item.id}
                      item={item}
                      coachName={coachName}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
