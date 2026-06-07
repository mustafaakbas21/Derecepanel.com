import {
  canonicalizeBookRow,
  isExampleBookRow,
  mapBookKind,
  mapHasVideo,
  mapStyle,
  parseDifficulty,
  resolveSubjectId,
  resolveTopicIds,
} from "@/lib/library/import/field-map";
import type { BookKind, LibraryBook } from "@/lib/library/types";
import type { RawSheetRow } from "@/lib/students/import/parse-file";

export type BookImportInput = Omit<LibraryBook, "id" | "createdAt">;

export type ParseBookImportResult = {
  books: BookImportInput[];
  errors: { row: number; reason: string }[];
  skipped: number;
};

function rowIndexFromSheet(r: number): number {
  return r + 2;
}

export function parseBookImportRows(rawRows: RawSheetRow[]): ParseBookImportResult {
  const books: BookImportInput[] = [];
  const errors: { row: number; reason: string }[] = [];
  let skipped = 0;

  rawRows.forEach((raw, i) => {
    const rowNum = rowIndexFromSheet(i);
    const canon = canonicalizeBookRow(raw);

    const note = Object.values(raw).join(" ").toLocaleLowerCase("tr-TR");
    if (note.startsWith("not:")) {
      skipped++;
      return;
    }

    const title = canon.title ?? "";
    const publisher = canon.publisher ?? "";

    if (!title && !publisher) {
      skipped++;
      return;
    }

    if (isExampleBookRow(title, publisher)) {
      skipped++;
      return;
    }

    if (!title) {
      errors.push({ row: rowNum, reason: "Kitap adı zorunlu." });
      return;
    }
    if (!publisher) {
      errors.push({ row: rowNum, reason: "Yayınevi zorunlu." });
      return;
    }

    const kind = mapBookKind(canon.kind ?? "");
    if (!kind) {
      errors.push({
        row: rowNum,
        reason: `Geçersiz tür: "${canon.kind || "—"}". Soru Bankası, Konu Anlatımı, Deneme veya Fasikül yazın.`,
      });
      return;
    }

    const subject = resolveSubjectId(canon.subject ?? "");
    if (!subject) {
      errors.push({
        row: rowNum,
        reason: `Ders bulunamadı: "${canon.subject || "—"}". Müfredattaki ders adını yazın (ör. TYT Matematik).`,
      });
      return;
    }

    const topicIds = resolveTopicIds(subject.id, canon.topics ?? "");
    const estRaw = canon.estQuestions ?? "";
    const estQuestions = estRaw ? parseInt(estRaw.replace(/[^\d]/g, ""), 10) : undefined;

    books.push({
      title,
      publisher,
      kind: kind as BookKind,
      subjectId: subject.id,
      topicIds,
      publishYear: canon.publishYear || undefined,
      estQuestions: Number.isFinite(estQuestions) ? estQuestions : undefined,
      difficulty: parseDifficulty(canon.difficulty ?? "3"),
      hasVideo: mapHasVideo(canon.hasVideo ?? ""),
      style: mapStyle(canon.style ?? "") || undefined,
    });
  });

  return { books, errors, skipped };
}
