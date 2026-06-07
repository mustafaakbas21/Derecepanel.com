"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, ImagePlus, Save } from "lucide-react";
import { toast } from "@/lib/notify";

import { DifficultyStars } from "@/components/library/book-difficulty";
import { BookThumb } from "@/components/library/book-thumb";
import { LIBRARY_DIALOG_LG } from "@/components/library/library-shell";
import "@/components/library/library.css";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { BOOK_KIND_LABELS, PUBLISH_YEAR_OPTIONS, STYLE_OPTIONS } from "@/lib/library/constants";
import type { BookKind, LibraryBook } from "@/lib/library/types";
import { getSubjects, getTopics } from "@/lib/mufredat";
import { cn } from "@/lib/utils";

export type BookFormPayload = Omit<LibraryBook, "id" | "createdAt">;

type Props = {
  open: boolean;
  editing: LibraryBook | null;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: BookFormPayload, editingId: string | null) => void;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(new Error("Dosya okunamadı"));
    r.readAsDataURL(file);
  });
}

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

export function BookFormDialog({ open, editing, onOpenChange, onSave }: Props) {
  const subjects = useMemo(() => getSubjects("ALL"), []);

  const [publisher, setPublisher] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<BookKind>("soru-bankasi");
  const [subjectId, setSubjectId] = useState("");
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [publishYear, setPublishYear] = useState("");
  const [estQuestions, setEstQuestions] = useState("");
  const [hasVideo, setHasVideo] = useState(false);
  const [style, setStyle] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [coverDataUrl, setCoverDataUrl] = useState("");
  const [pdfDataUrl, setPdfDataUrl] = useState("");
  const [pdfName, setPdfName] = useState("");

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      setPublisher("");
      setTitle("");
      setKind("soru-bankasi");
      setSubjectId("");
      setTopicIds([]);
      setPublishYear("");
      setEstQuestions("");
      setHasVideo(false);
      setStyle("");
      setDifficulty(3);
      setCoverDataUrl("");
      setPdfDataUrl("");
      setPdfName("");
      return;
    }
    setPublisher(editing.publisher);
    setTitle(editing.title);
    setKind(editing.kind);
    setSubjectId(editing.subjectId);
    setTopicIds(editing.topicIds ?? []);
    setPublishYear(editing.publishYear ?? "");
    setEstQuestions(editing.estQuestions != null ? String(editing.estQuestions) : "");
    setHasVideo(!!editing.hasVideo);
    setStyle(editing.style ?? "");
    setDifficulty(editing.difficulty || 3);
    setCoverDataUrl(editing.coverDataUrl ?? "");
    setPdfDataUrl(editing.pdfDataUrl ?? "");
    setPdfName(editing.pdfName ?? "");
  }, [open, editing]);

  const topics = useMemo(() => (subjectId ? getTopics(subjectId) : []), [subjectId]);

  const previewBook: LibraryBook = {
    id: "preview",
    title: title || "Kitap adı",
    publisher: publisher || "Yayınevi",
    kind,
    subjectId,
    topicIds,
    difficulty,
    coverDataUrl: coverDataUrl || undefined,
    createdAt: "",
  };

  const toggleTopic = (id: string) => {
    setTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisher.trim() || !title.trim() || !subjectId) {
      toast.error("Yayınevi, kitap adı ve ders zorunludur.");
      return;
    }
    onSave(
      {
        publisher: publisher.trim(),
        title: title.trim(),
        kind,
        subjectId,
        topicIds,
        publishYear: publishYear || undefined,
        estQuestions: estQuestions ? Number(estQuestions) : undefined,
        hasVideo,
        style: style || undefined,
        difficulty,
        coverDataUrl: coverDataUrl || undefined,
        pdfDataUrl: pdfDataUrl || undefined,
        pdfName: pdfName || undefined,
      },
      editing?.id ?? null
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={LIBRARY_DIALOG_LG}>
        <DialogHeader className="lib-panel-head shrink-0 border-b border-slate-200 px-6 py-5 pr-14">
          <DialogTitle className="text-xl">
            {editing ? "Kitabı düzenle" : "Yeni kitap kaydı"}
          </DialogTitle>
          <DialogDescription className="text-[14px] leading-relaxed">
            Yayınevi, müfredat kapsamı ve dosyalar — atama ekranında arama kalitesini belirler.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="lib-scroll-pane flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[300px_1fr]">
            <aside className="border-b border-slate-200 bg-slate-50/60 p-6 lg:border-b-0 lg:border-r">
              <div className="mx-auto max-w-[200px]">
                <BookThumb book={previewBook} size="lg" />
              </div>
              <p className="mt-4 text-center text-sm font-semibold text-slate-900 line-clamp-2">
                {title || "—"}
              </p>
              <p className="text-center text-xs text-slate-500">{publisher || "—"}</p>
              <div className="mt-4 flex justify-center">
                <DifficultyStars value={difficulty} onChange={setDifficulty} />
              </div>

              <div className="mt-6 space-y-3">
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-center transition hover:border-slate-400 hover:bg-slate-50">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        setCoverDataUrl(await readFileAsDataUrl(f));
                      } catch {
                        toast.error("Kapak yüklenemedi.");
                      }
                    }}
                  />
                  <ImagePlus className="h-6 w-6 text-slate-800" />
                  <span className="text-xs font-semibold text-slate-700">Kapak yükle</span>
                </label>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-center transition hover:border-teal-500 hover:bg-teal-50/30">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        setPdfDataUrl(await readFileAsDataUrl(f));
                        setPdfName(f.name);
                      } catch {
                        toast.error("PDF yüklenemedi.");
                      }
                    }}
                  />
                  <FileText className="h-6 w-6 text-teal-600" />
                  <span className="text-xs font-semibold text-slate-700">PDF ekle</span>
                  {pdfName ? (
                    <span className="max-w-full truncate text-[10px] text-slate-500">{pdfName}</span>
                  ) : null}
                </label>
              </div>
            </aside>

            <div className="lib-scroll-pane min-h-0 space-y-5 overflow-y-auto p-6">
              <FieldGroup title="Temel bilgiler">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Yayınevi</Label>
                    <Input
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      required
                      placeholder="Paraf Yayınları"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kitap adı</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="345 TYT Matematik Soru Bankası"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ders</Label>
                    <Select
                      value={subjectId || "__none"}
                      onValueChange={(v) => {
                        const id = v === "__none" ? "" : v;
                        setSubjectId(id);
                        setTopicIds([]);
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Ders seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">— Ders seçin —</SelectItem>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.track})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Kitap türü</Label>
                    <Select value={kind} onValueChange={(v) => setKind(v as BookKind)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BOOK_KIND_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </FieldGroup>

              <FieldGroup title="Detay & etiketler">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Basım yılı</Label>
                    <Select
                      value={publishYear || "__none"}
                      onValueChange={(v) => setPublishYear(v === "__none" ? "" : v)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">— Seçin —</SelectItem>
                        {PUBLISH_YEAR_OPTIONS.filter(Boolean).map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tahmini soru</Label>
                    <Input
                      type="number"
                      min={0}
                      className="h-11"
                      value={estQuestions}
                      onChange={(e) => setEstQuestions(e.target.value)}
                      placeholder="450"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Soru tarzı</Label>
                    <Select
                      value={style || "__none"}
                      onValueChange={(v) => setStyle(v === "__none" ? "" : v)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_OPTIONS.map((o) => (
                          <SelectItem key={o.value || "__none"} value={o.value || "__none"}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 px-4 sm:col-span-2">
                    <Checkbox
                      id="lib-video-v2"
                      checked={hasVideo}
                      onCheckedChange={(c) => setHasVideo(!!c)}
                    />
                    <Label htmlFor="lib-video-v2" className="cursor-pointer font-normal">
                      Video çözüm paketi var
                    </Label>
                  </div>
                </div>
              </FieldGroup>

              <FieldGroup title="Konu kapsamı">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    {topicIds.length > 0
                      ? `${topicIds.length} konu seçili`
                      : "Ders seçildikten sonra konuları işaretleyin"}
                  </p>
                  {topics.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTopicIds(topics.map((t) => t.id))}
                      >
                        Tümünü seç
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setTopicIds([])}>
                        Temizle
                      </Button>
                    </div>
                  )}
                </div>
                {!subjectId ? (
                  <p className="text-sm text-slate-500">Önce ders seçin.</p>
                ) : (
                  <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto lib-scroll-pane">
                    {topics.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTopic(t.id)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          topicIds.includes(t.id)
                            ? "border-slate-900 bg-slate-100 text-slate-900"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                        )}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </FieldGroup>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" className="h-11 px-6" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary" className="h-11 px-8">
              <Save className="mr-2 h-4 w-4" />
              {editing ? "Değişiklikleri kaydet" : "Kitabı kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
