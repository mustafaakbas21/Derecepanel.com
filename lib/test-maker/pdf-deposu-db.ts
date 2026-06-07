import { PDF_DEPOSU_MAX_BYTES } from "@/lib/test-maker/constants";
import {
  cloudArchiveDelete,
  cloudArchiveFetchFile,
  cloudArchiveList,
  cloudArchivePut,
} from "@/lib/appwrite/archive-client";
import { panelGetItem, panelSetItem } from "@/lib/panel-store";

export type PdfDeposuMeta = {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: number;
};

const MIGRATED_KEY = "derece_pdf_deposu_cloud_v1";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export { formatSize as formatPdfDeposuSize };

function parseMeta(payload: string, id: string): PdfDeposuMeta | null {
  try {
    const m = JSON.parse(payload) as PdfDeposuMeta;
    if (!m?.name) return null;
    return {
      id,
      name: m.name,
      size: Number(m.size) || 0,
      type: m.type || "application/pdf",
      addedAt: Number(m.addedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

async function migrateLegacyIdbIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (panelGetItem(MIGRATED_KEY) === "1") return;

  try {
    if (!("indexedDB" in window)) {
      panelSetItem(MIGRATED_KEY, "1");
      return;
    }

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("pdfDeposuDB", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const records = await new Promise<Array<{ id: number; name: string; size: number; type: string; addedAt: number; blob: Blob }>>(
      (resolve, reject) => {
        const tx = db.transaction("files", "readonly");
        const req = tx.objectStore("files").getAll();
        req.onsuccess = () => resolve((req.result as never[]) || []);
        req.onerror = () => reject(req.error);
      }
    );

    for (const rec of records) {
      const id = `pdf-${rec.id}`;
      const meta: PdfDeposuMeta = {
        id,
        name: rec.name,
        size: rec.size,
        type: rec.type,
        addedAt: rec.addedAt,
      };
      await cloudArchivePut({
        scope: "pdf_deposu",
        id,
        payload: JSON.stringify(meta),
        file: new File([rec.blob], rec.name, { type: rec.type }),
      });
    }

    panelSetItem(MIGRATED_KEY, "1");
  } catch {
    /* tekrar dene */
  }
}

export async function pdfDeposuList(): Promise<PdfDeposuMeta[]> {
  await migrateLegacyIdbIfNeeded();
  const items = await cloudArchiveList("pdf_deposu");
  return items
    .map((item) => parseMeta(item.payload, item.id))
    .filter((x): x is PdfDeposuMeta => !!x)
    .sort((a, b) => b.addedAt - a.addedAt);
}

export async function pdfDeposuAdd(file: File): Promise<PdfDeposuMeta> {
  if (file.size > PDF_DEPOSU_MAX_BYTES) throw new Error("too_large");

  const id = `pdf-${Date.now().toString(36)}`;
  const meta: PdfDeposuMeta = {
    id,
    name: file.name || "isimsiz.pdf",
    size: file.size,
    type: file.type || "application/pdf",
    addedAt: Date.now(),
  };

  await cloudArchivePut({
    scope: "pdf_deposu",
    id,
    payload: JSON.stringify(meta),
    file,
    filename: meta.name,
  });

  return meta;
}

export async function pdfDeposuGetFile(id: string | number): Promise<File | null> {
  const cloudId = String(id);
  const item = (await cloudArchiveList("pdf_deposu")).find((x) => x.id === cloudId);
  if (!item) return null;

  const blob = await cloudArchiveFetchFile(item);
  if (!blob) return null;

  const meta = parseMeta(item.payload, cloudId);
  return new File([blob], meta?.name || "dosya.pdf", {
    type: meta?.type || "application/pdf",
  });
}

export async function pdfDeposuDelete(id: string | number): Promise<void> {
  await cloudArchiveDelete("pdf_deposu", String(id));
}

export async function pdfDeposuTotalSize(): Promise<number> {
  const list = await pdfDeposuList();
  return list.reduce((s, f) => s + f.size, 0);
}
