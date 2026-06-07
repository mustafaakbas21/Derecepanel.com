import { addBooksBatch, loadBooks } from "@/lib/library/library-storage";
import type { BookImportInput } from "@/lib/library/import/parse-rows";
import type { LibraryBook } from "@/lib/library/types";

function bookKey(title: string, publisher: string): string {
  return `${title.trim().toLocaleLowerCase("tr-TR")}::${publisher.trim().toLocaleLowerCase("tr-TR")}`;
}

export type BookImportPersistResult = {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
  records: LibraryBook[];
};

export function persistBookImports(
  inputs: BookImportInput[],
  parseErrors: { row: number; reason: string }[],
  parseSkipped: number
): BookImportPersistResult {
  const existing = loadBooks();
  const existingKeys = new Set(existing.map((b) => bookKey(b.title, b.publisher)));

  const toAdd: BookImportInput[] = [];
  const errors = [...parseErrors];
  let dupSkipped = 0;

  inputs.forEach((input, i) => {
    const key = bookKey(input.title, input.publisher);
    if (existingKeys.has(key)) {
      dupSkipped++;
      errors.push({
        row: i + 2,
        reason: `"${input.title}" (${input.publisher}) zaten kayıtlı — atlandı.`,
      });
      return;
    }
    existingKeys.add(key);
    toAdd.push(input);
  });

  const records = toAdd.length > 0 ? addBooksBatch(toAdd) : [];

  return {
    imported: records.length,
    skipped: parseSkipped + dupSkipped,
    errors,
    records,
  };
}
