"use client";

import { useMemo, useState } from "react";
import {
  BookMarked,
  Calendar,
  Check,
  Search,
  StickyNote,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "@/lib/notify";

import { DifficultyStars } from "@/components/library/book-difficulty";
import { BookThumb } from "@/components/library/book-thumb";
import {
  LIBRARY_DIALOG_XL,
  LibraryProgressBar,
  LibrarySectionTitle,
} from "@/components/library/library-shell";
import "@/components/library/library.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLibrary } from "@/hooks/use-library";
import { BOOK_KIND_LABELS } from "@/lib/library/constants";
import { bookKindLabel, bookSearchHaystack, bookSubjectLabel } from "@/lib/library/book-meta";
import type { LibraryBook } from "@/lib/library/types";
import { getSubjects } from "@/lib/mufredat";
import { FIELD_LABELS } from "@/lib/students/constants";
import { normalizeStudyField } from "@/lib/students/normalize-field";
import type { StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

type Props = {
  student: StudentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StudentAssignDialog({ student, open, onOpenChange }: Props) {
  const { books, assignments, addAssignment, setAssignmentProgress, removeAssignment } =
    useLibrary();

  const [pickerQ, setPickerQ] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  const subjects = useMemo(() => getSubjects("ALL"), []);

  const studentAssignments = useMemo(() => {
    if (!student) return [];
    return assignments.filter((a) => a.studentId === student.ogrenciId);
  }, [assignments, student]);

  const assignedBookIds = useMemo(
    () => new Set(studentAssignments.map((a) => a.bookId)),
    [studentAssignments]
  );

  const availableBooks = useMemo(() => {
    const q = pickerQ.trim().toLowerCase();
    return books.filter((b) => {
      if (assignedBookIds.has(b.id)) return false;
      if (kindFilter !== "all" && b.kind !== kindFilter) return false;
      if (subjectFilter !== "all" && b.subjectId !== subjectFilter) return false;
      if (q && !bookSearchHaystack(b).includes(q)) return false;
      return true;
    });
  }, [books, assignedBookIds, kindFilter, subjectFilter, pickerQ]);

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId),
    [books, selectedBookId]
  );

  const avgProgress = useMemo(() => {
    if (studentAssignments.length === 0) return 0;
    const sum = studentAssignments.reduce((s, a) => s + a.progress, 0);
    return Math.round(sum / studentAssignments.length);
  }, [studentAssignments]);

  const resetPicker = () => {
    setPickerQ("");
    setKindFilter("all");
    setSubjectFilter("all");
    setSelectedBookId(null);
    setDueDate("");
    setNote("");
  };

  const handleAssign = () => {
    if (!student || !selectedBookId) {
      toast.error("Lütfen atanacak bir kitap seçin.");
      return;
    }
    try {
      addAssignment({
        studentId: student.ogrenciId,
        bookId: selectedBookId,
        dueDate: dueDate || undefined,
        note: note.trim() || undefined,
      });
      toast.success("Kaynak başarıyla atandı.");
      setSelectedBookId(null);
      setDueDate("");
      setNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Atama yapılamadı.");
    }
  };

  const bookById = (id: string) => books.find((b) => b.id === id);

  const initials =
    student?.name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() ?? "?";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetPicker();
        onOpenChange(v);
      }}
    >
      <DialogContent className={cn(LIBRARY_DIALOG_XL, "lib-page")}>
        <DialogHeader className="lib-panel-head shrink-0 border-b border-slate-200 px-6 py-5 pr-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white shadow-md">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl sm:text-2xl">
                {student ? student.name : "Öğrenci"}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  {student ? (
                    <>
                      <Badge variant="blue" className="font-mono text-xs">
                        {student.studentCode}
                      </Badge>
                      <Badge variant="teal">{student.sinifBranch}</Badge>
                      <Badge variant="default">
                        {FIELD_LABELS[normalizeStudyField(student.alan)]}
                      </Badge>
                      <span className="text-slate-500">
                        {studentAssignments.length} kaynak · ort. %{avgProgress}
                      </span>
                    </>
                  ) : null}
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
          {/* Mevcut kaynaklar */}
          <section className="flex min-h-[min(52vh,480px)] flex-col border-b border-slate-200 lg:min-h-0 lg:border-b-0 lg:border-r">
            <div className="lib-panel-head shrink-0 border-b border-slate-200 px-5 py-4">
              <LibrarySectionTitle
                title="Mevcut kaynaklar"
                subtitle="İlerlemeyi güncelleyin veya atamayı kaldırın"
              />
            </div>
            <div className="lib-scroll-pane min-h-0 flex-1 overflow-y-auto p-5">
              {studentAssignments.length === 0 ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center">
                  <BookMarked className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-medium text-slate-700">Henüz kaynak yok</p>
                  <p className="mt-1 max-w-xs text-sm text-slate-500">
                    Sağ panelden kütüphanedeki bir kitabı seçip öğrenciye atayabilirsiniz.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {studentAssignments.map((asg) => {
                    const book = bookById(asg.bookId);
                    if (!book) return null;
                    return (
                      <li
                        key={asg.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex gap-4">
                          <BookThumb book={book} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold leading-snug text-slate-900">
                                  {book.title}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {book.publisher} · {bookKindLabel(book.kind)}
                                </p>
                                <p className="mt-1 text-xs font-medium text-slate-600">
                                  {bookSubjectLabel(book)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-red-600 hover:bg-red-50"
                                aria-label="Atamayı kaldır"
                                onClick={() => {
                                  removeAssignment(asg.id);
                                  toast.message("Atama kaldırıldı.");
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="mt-3">
                              <LibraryProgressBar value={asg.progress} />
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={asg.progress}
                                className="mt-2 w-full accent-slate-900"
                                onChange={(e) =>
                                  setAssignmentProgress(asg.id, Number(e.target.value))
                                }
                              />
                            </div>
                            {asg.dueDate || asg.note ? (
                              <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                                {asg.dueDate ? (
                                  <p className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Hedef: {asg.dueDate}
                                  </p>
                                ) : null}
                                {asg.note ? (
                                  <p className="flex items-start gap-1">
                                    <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
                                    {asg.note}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Yeni atama */}
          <section className="flex min-h-[min(52vh,480px)] flex-col lg:min-h-0">
            <div className="lib-panel-head lib-panel-head--assign shrink-0 border-b border-slate-200 px-5 py-4">
              <LibrarySectionTitle
                title="Yeni kaynak ata"
                subtitle={`${availableBooks.length} uygun kitap`}
              />
            </div>

            <div className="shrink-0 space-y-3 border-b border-slate-200 bg-white p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="h-11 pl-10"
                  placeholder="Kitap adı, yayınevi veya ders ara…"
                  value={pickerQ}
                  onChange={(e) => setPickerQ(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select value={kindFilter} onValueChange={setKindFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Tür" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm türler</SelectItem>
                    {Object.entries(BOOK_KIND_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="h-10">
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
              </div>
            </div>

            <div className="lib-scroll-pane min-h-0 flex-1 overflow-y-auto p-5">
              {books.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  Kütüphanede kitap yok. Kitap Listesi sayfasından ekleyin.
                </p>
              ) : availableBooks.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  Filtreye uyan veya atanmamış kitap kalmadı.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                  {availableBooks.map((book) => (
                    <PickerCard
                      key={book.id}
                      book={book}
                      selected={selectedBookId === book.id}
                      onSelect={() => setSelectedBookId(book.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-slate-50/90 p-5">
              {selectedBook ? (
                <div className="mb-4 flex gap-3 rounded-xl border border-slate-300 bg-slate-100/80 p-3">
                  <BookThumb book={selectedBook} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase text-slate-700">Seçili</p>
                    <p className="truncate text-sm font-bold text-slate-900">{selectedBook.title}</p>
                    <p className="text-xs text-slate-600">{bookSubjectLabel(selectedBook)}</p>
                  </div>
                  <Check className="h-5 w-5 shrink-0 text-slate-900" />
                </div>
              ) : (
                <p className="mb-4 text-center text-xs text-slate-500">
                  Atamak için listeden bir kitap seçin
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    Hedef tarih
                  </Label>
                  <Input
                    type="date"
                    className="h-10"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <StickyNote className="h-3.5 w-3.5" />
                    Koç notu
                  </Label>
                  <Input
                    className="h-10"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Opsiyonel"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                className="mt-4 h-11 w-full text-base"
                disabled={!selectedBookId}
                onClick={handleAssign}
              >
                <User className="mr-2 h-4 w-4" />
                Kaynağı öğrenciye ata
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PickerCard({
  book,
  selected,
  onSelect,
}: {
  book: LibraryBook;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      data-selected={selected}
      onClick={onSelect}
      className="lib-book-picker-card flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left"
    >
      <div className="bg-slate-50 p-2">
        <BookThumb book={book} size="sm" />
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-900">{book.title}</p>
        <p className="truncate text-[10px] text-slate-500">{book.publisher}</p>
        <p className="text-[10px] font-medium text-slate-600">{bookSubjectLabel(book)}</p>
        <DifficultyStars value={book.difficulty} readOnly size="sm" />
      </div>
    </button>
  );
}
