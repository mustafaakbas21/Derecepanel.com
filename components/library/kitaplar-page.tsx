"use client";

import { useMemo, useState } from "react";
import { BookOpen, Filter, Plus, Search, Upload } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "@/lib/notify";

import { BookCard } from "@/components/library/book-card";
import { BookBulkImportDialog } from "@/components/library/bulk-import-dialog";
import { BookFormDialog, type BookFormPayload } from "@/components/library/book-form-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLibrary } from "@/hooks/use-library";
import { BOOK_KIND_LABELS } from "@/lib/library/constants";
import { bookSearchHaystack } from "@/lib/library/book-meta";
import type { LibraryBook } from "@/lib/library/types";
import { getSubjects } from "@/lib/mufredat";

export function KitaplarPage() {
  const { confirm, ConfirmHost } = useConfirm();
  const { books, assignments, hydrated, addBook, updateBook, deleteBook, refresh } =
    useLibrary();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryBook | null>(null);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const subjects = useMemo(() => getSubjects("ALL"), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((b) => {
      if (kindFilter !== "all" && b.kind !== kindFilter) return false;
      if (subjectFilter !== "all" && b.subjectId !== subjectFilter) return false;
      if (q && !bookSearchHaystack(b).includes(q)) return false;
      return true;
    });
  }, [books, search, kindFilter, subjectFilter]);

  const kindCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of books) {
      m[b.kind] = (m[b.kind] ?? 0) + 1;
    }
    return m;
  }, [books]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (book: LibraryBook) => {
    setEditing(book);
    setFormOpen(true);
  };

  const handleSave = (payload: BookFormPayload, editingId: string | null) => {
    if (editingId) {
      updateBook(editingId, payload);
      toast.success("Kitap güncellendi.");
    } else {
      addBook(payload);
      toast.success("Kitap kütüphaneye eklendi.");
    }
    setEditing(null);
  };

  const clearFilters = () => {
    setSearch("");
    setKindFilter("all");
    setSubjectFilter("all");
  };

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Kitap Listesi & Kayıt"
        description="Kaynakları müfredat ve yayınevi bilgisiyle tanımlayın; Kaynak Atama ekranından öğrencilere atayın."
        meta={`${books.length} kitap · ${assignments.length} aktif atama`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200 bg-white"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Toplu içe aktar
            </Button>
            <Button type="button" variant="primary" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Yeni kitap ekle
            </Button>
          </div>
        }
      />

      <LibraryInsights
        metrics={[
          { label: "Toplam kitap", value: books.length, icon: BookOpen },
          {
            label: "Soru bankası",
            value: kindCounts["soru-bankasi"] ?? 0,
            sub: "Kütüphane",
            icon: BookOpen,
          },
          {
            label: "Konu anlatım",
            value: kindCounts["konu-anlatim"] ?? 0,
            icon: BookOpen,
          },
          {
            label: "Aktif atama",
            value: assignments.length,
            sub: "Tüm öğrenciler",
            icon: Filter,
          },
        ]}
      />

      <section className={LIBRARY_PANEL_CLASS} aria-label="Kitap listesi">
        <div className={LIBRARY_PANEL_INNER}>
          <LibraryFilterBar
            trailing={
              filtered.length === books.length
                ? `${books.length} kitap`
                : `${filtered.length} / ${books.length} kitap`
            }
          >
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-11 border-slate-200 bg-slate-50/50 pl-9"
                placeholder="Kitap, yayınevi veya ders ara…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={kindFilter} onValueChange={setKindFilter}>
              <SelectTrigger className="h-11 w-full sm:w-[160px]">
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
              <SelectTrigger className="h-11 w-full sm:w-[180px]">
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
            {(kindFilter !== "all" || subjectFilter !== "all" || search) && (
              <Button type="button" variant="ghost" className="h-11" onClick={clearFilters}>
                Temizle
              </Button>
            )}
          </LibraryFilterBar>

          {!hydrated ? (
            <p className="py-12 text-center text-sm text-slate-500">Kütüphane yükleniyor…</p>
          ) : filtered.length === 0 ? (
            <LibraryEmptyState
              title={books.length === 0 ? "Henüz kitap yok" : "Sonuç bulunamadı"}
              description={
                books.length === 0
                  ? "İlk kaynağınızı ekleyin; ardından Kaynak Atama ile öğrencilere dağıtın."
                  : "Arama veya filtre kriterlerini değiştirmeyi deneyin."
              }
              action={
                books.length === 0 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" onClick={() => setImportOpen(true)}>
                      <Upload className="h-4 w-4" />
                      Toplu içe aktar
                    </Button>
                    <Button variant="primary" onClick={openNew}>
                      <Plus className="h-4 w-4" />
                      İlk kitabı ekle
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={clearFilters}>
                    Filtreleri sıfırla
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onEdit={() => openEdit(book)}
                  onDelete={() => {
                    void (async () => {
                      const ok = await confirm({
                        title: `"${book.title}" silinsin mi?`,
                        description: "İlişkili atamalar da kaldırılır.",
                        confirmLabel: "Sil",
                        destructive: true,
                      });
                      if (!ok) return;
                      deleteBook(book.id);
                      toast.message("Kitap silindi.");
                    })();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <BookFormDialog
        open={formOpen}
        editing={editing}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        onSave={handleSave}
      />

      <BookBulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => refresh()}
      />
      {ConfirmHost}
    </div>
  );
}
