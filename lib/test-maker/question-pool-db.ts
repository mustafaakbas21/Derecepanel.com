import {
  cloudArchiveDelete,
  cloudArchiveList,
  cloudArchivePut,
} from "@/lib/appwrite/archive-client";
import { resolveCloudImageDataUrl } from "@/lib/appwrite/blob-client";
import { QUESTION_POOL_DB, STORAGE_KEYS } from "@/lib/test-maker/constants";
import type { QuestionPoolItem } from "@/lib/test-maker/types";
import { panelGetItem, panelSetItem } from "@/lib/panel-store";

const POOL_SCOPE = "question_pool" as const;
const CLOUD_MIGRATED_KEY = "derece_soru_havuzu_cloud_v1";

type PoolMeta = Omit<QuestionPoolItem, "uuid" | "dataUrl">;

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const header = parts[0] ?? "";
  const b64 = parts[1] ?? "";
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Blob okunamadı"));
    reader.readAsDataURL(blob);
  });
}

/** PNG → JPEG sıkıştırma */
async function optimizeImageBlob(dataUrl: string): Promise<Blob> {
  if (!dataUrl.startsWith("data:image/") || dataUrl.startsWith("data:image/svg")) {
    return dataUrlToBlob(dataUrl);
  }
  if (typeof document === "undefined") return dataUrlToBlob(dataUrl);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx || canvas.width < 1 || canvas.height < 1) {
        resolve(dataUrlToBlob(dataUrl));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => resolve(blob ?? dataUrlToBlob(dataUrl)),
        "image/jpeg",
        0.88
      );
    };
    img.onerror = () => resolve(dataUrlToBlob(dataUrl));
    img.src = dataUrl;
  });
}

function stripMeta(item: QuestionPoolItem): PoolMeta {
  const { uuid: _u, dataUrl: _d, ...meta } = item;
  return meta;
}

async function archiveRowToItem(row: {
  id: string;
  payload: string;
  fileId?: string;
  bucketId?: string;
}): Promise<QuestionPoolItem> {
  let meta = {} as Partial<PoolMeta>;
  try {
    meta = JSON.parse(row.payload) as PoolMeta;
  } catch {
    meta = {};
  }

  const fileId = row.fileId || meta.imageFileId;
  const bucketId = row.bucketId || meta.imageBucketId;

  let dataUrl = "";
  if (fileId && bucketId) {
    dataUrl = await resolveCloudImageDataUrl({
      imageFileId: fileId,
      imageBucketId: bucketId,
    });
  }

  return {
    uuid: row.id,
    dataUrl,
    ders: meta.ders ?? "",
    konu: meta.konu ?? "",
    kavram: meta.kavram ?? "",
    answer: meta.answer ?? null,
    savedAt: meta.savedAt ?? new Date().toISOString(),
    ...meta,
    imageFileId: fileId,
    imageBucketId: bucketId,
  };
}

async function persistItemToCloud(item: QuestionPoolItem): Promise<void> {
  const meta = stripMeta(item);
  const hasInline = typeof item.dataUrl === "string" && item.dataUrl.length > 0;

  if (hasInline) {
    const blob = await optimizeImageBlob(item.dataUrl);
    await cloudArchivePut({
      scope: POOL_SCOPE,
      id: item.uuid,
      payload: JSON.stringify(meta),
      file: blob,
      filename: `${item.uuid}.jpg`,
    });
    return;
  }

  await cloudArchivePut({
    scope: POOL_SCOPE,
    id: item.uuid,
    payload: JSON.stringify({
      ...meta,
      imageFileId: meta.imageFileId || item.imageFileId,
      imageBucketId: meta.imageBucketId || item.imageBucketId,
    }),
  });
}

async function migrateLegacyIdbToCloud(): Promise<void> {
  if (typeof window === "undefined") return;
  if (panelGetItem(CLOUD_MIGRATED_KEY) === "1") return;

  try {
    if (!("indexedDB" in window)) {
      panelSetItem(CLOUD_MIGRATED_KEY, "1");
      return;
    }

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(QUESTION_POOL_DB.name, QUESTION_POOL_DB.version);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    type LegacyRec = {
      uuid: string;
      meta: PoolMeta;
      blob?: Blob;
    };

    const records = await new Promise<LegacyRec[]>((resolve, reject) => {
      const tx = db.transaction(QUESTION_POOL_DB.store, "readonly");
      const req = tx.objectStore(QUESTION_POOL_DB.store).getAll();
      req.onsuccess = () => resolve((req.result as LegacyRec[]) || []);
      req.onerror = () => reject(req.error);
    });

    for (const rec of records) {
      if (!rec?.uuid) continue;
      let dataUrl = "";
      if (rec.blob) {
        dataUrl = await blobToDataUrl(rec.blob);
      }
      await persistItemToCloud({
        uuid: rec.uuid,
        dataUrl,
        ...rec.meta,
      });
    }

    if (records.length > 0) {
      const clearTx = db.transaction(QUESTION_POOL_DB.store, "readwrite");
      clearTx.objectStore(QUESTION_POOL_DB.store).clear();
    }

    panelSetItem(CLOUD_MIGRATED_KEY, "1");
    panelSetItem(STORAGE_KEYS.questionPoolIdbMigrated, "1");
  } catch {
    /* tekrar dene */
  }
}

export async function dbPutMany(items: QuestionPoolItem[]): Promise<void> {
  if (!items.length) return;
  await migrateLegacyIdbToCloud();
  await Promise.all(items.map((item) => persistItemToCloud(item)));
}

export async function dbReplaceAll(items: QuestionPoolItem[]): Promise<void> {
  await migrateLegacyIdbToCloud();

  const existing = await cloudArchiveList(POOL_SCOPE);
  const nextIds = new Set(items.map((x) => x.uuid));

  await Promise.all(
    existing
      .filter((row) => !nextIds.has(row.id))
      .map((row) => cloudArchiveDelete(POOL_SCOPE, row.id))
  );

  await Promise.all(items.map((item) => persistItemToCloud(item)));
}

export async function dbGetAll(): Promise<QuestionPoolItem[]> {
  await migrateLegacyIdbToCloud();

  const rows = await cloudArchiveList(POOL_SCOPE);
  const items = await Promise.all(rows.map((row) => archiveRowToItem(row)));

  return items.sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

export async function dbDelete(uuid: string): Promise<void> {
  await cloudArchiveDelete(POOL_SCOPE, uuid);
}

export async function dbClear(): Promise<void> {
  const rows = await cloudArchiveList(POOL_SCOPE);
  await Promise.all(rows.map((row) => cloudArchiveDelete(POOL_SCOPE, row.id)));
}

export async function dbUpdateMeta(
  uuid: string,
  patch: Partial<Omit<QuestionPoolItem, "uuid" | "dataUrl">>
): Promise<void> {
  const rows = await cloudArchiveList(POOL_SCOPE);
  const row = rows.find((x) => x.id === uuid);
  if (!row) return;

  let meta = {} as Partial<PoolMeta>;
  try {
    meta = JSON.parse(row.payload) as PoolMeta;
  } catch {
    meta = {};
  }

  const merged = { ...meta, ...patch };
  await cloudArchivePut({
    scope: POOL_SCOPE,
    id: uuid,
    payload: JSON.stringify(merged),
  });
}
