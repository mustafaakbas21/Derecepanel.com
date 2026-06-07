"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, Library, Plus, Search, Sparkles, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLibrary } from "@/hooks/use-library";
import { bookKindLabel, bookSubjectLabel } from "@/lib/library/book-meta";
import type { LibraryBook } from "@/lib/library/types";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

export function BookMultiSelect({
  subjectId,
  value,
  onChange,
}: {
  subjectId: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { books } = useLibrary();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const openSnapshot = useRef<string[]>(value);

  useEffect(() => {
    if (open) openSnapshot.current = value;
  }, [open, value]);

  const selectedBooks = useMemo(
    () =>
      value
        .map((id) => books.find((b) => b.id === id))
        .filter((b): b is LibraryBook => Boolean(b)),
    [value, books]
  );

  const { recommended, others } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (b: LibraryBook) =>
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.publisher.toLowerCase().includes(q) ||
      bookSubjectLabel(b).toLowerCase().includes(q);

    const rec: LibraryBook[] = [];
    const rest: LibraryBook[] = [];
    for (const b of books) {
      if (!match(b)) continue;
      if (subjectId && b.subjectId === subjectId) rec.push(b);
      else rest.push(b);
    }
    const byTitle = (a: LibraryBook, b: LibraryBook) =>
      a.title.localeCompare(b.title, "tr");
    return { recommended: rec.sort(byTitle), others: rest.sort(byTitle) };
  }, [books, query, subjectId]);

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      const before = [...openSnapshot.current].sort().join("|");
      const after = [...value].sort().join("|");
      if (before !== after) toast.success("Kaynaklar güncellendi");
    }
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {selectedBooks.length > 0 ? (
        selectedBooks.map((b) => (
          <span
            key={b.id}
            className="inline-flex max-w-[200px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-2 pr-1 text-xs font-medium text-slate-700"
          >
            <BookOpen className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="truncate">{b.title}</span>
            <button
              type="button"
              onClick={() => toggle(b.id)}
              aria-label={`${b.title} kaynağını kaldır`}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))
      ) : (
        <span className="text-xs text-slate-400">Kaynak seçilmedi</span>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
      >
        <Plus className="h-3.5 w-3.5" />
        Kaynak seç
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kaynak kitap seç</DialogTitle>
            <DialogDescription>
              Bu konuda kullanılan kitapları işaretleyin. Derse uygun kitaplar
              &quot;Önerilen&quot; olarak öne çıkar; aramayla tüm kütüphaneye ulaşabilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-11 border-slate-200 bg-slate-50/50 pl-9"
              placeholder="Kitap adı, yayınevi veya ders ara…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-[48vh] space-y-4 overflow-y-auto pr-1">
            {books.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Library className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">
                  Kütüphanede kitap yok
                </p>
                <p className="text-xs text-slate-400">
                  Önce Kitap Kütüphanesi sayfasından kitap ekleyin.
                </p>
              </div>
            ) : recommended.length === 0 && others.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Aramanıza uygun kitap bulunamadı.
              </p>
            ) : (
              <>
                {recommended.length > 0 && (
                  <BookGroup
                    title="Önerilen"
                    icon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                    books={recommended}
                    value={value}
                    onToggle={toggle}
                  />
                )}
                {others.length > 0 && (
                  <BookGroup
                    title={recommended.length > 0 ? "Diğer kitaplar" : "Tüm kitaplar"}
                    books={others}
                    value={value}
                    onToggle={toggle}
                  />
                )}
              </>
            )}
          </div>

          <p className="text-xs text-slate-400">
            {value.length} kaynak seçili · değişiklikler otomatik kaydedilir
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookGroup({
  title,
  icon,
  books,
  value,
  onToggle,
}: {
  title: string;
  icon?: React.ReactNode;
  books: LibraryBook[];
  value: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {icon}
        {title}
      </p>
      <div className="space-y-1">
        {books.map((b) => {
          const checked = value.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onToggle(b.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                checked
                  ? "border-slate-900 bg-slate-900/[0.03]"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                  checked
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white"
                )}
              >
                {checked && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {b.title}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {b.publisher || "Yayınevi belirtilmemiş"} · {bookSubjectLabel(b)} ·{" "}
                  {bookKindLabel(b.kind)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
