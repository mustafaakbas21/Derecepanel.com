import {
  dataUrlToBlob,
  resolveImageBucketId,
  resolvePdfBucketId,
  uploadBlobToStorage,
} from "@/lib/appwrite/blob-client";
import {
  encodeCloudRef,
  isCloudRef,
  isDataUrl,
} from "@/lib/appwrite/storage-refs";
import { HATA_RECETE_LS } from "@/lib/hata-recetesi/constants";
import { questionImageUrl } from "@/lib/hata-recetesi/filters";
import type { WrongQuestionRecord } from "@/lib/hata-recetesi/types";
import { panelGetItem, panelSetItem } from "@/lib/panel-store";
import { loadStudentsFull } from "@/lib/students/storage";
import { KURUM_DENEME_PDF_KEY } from "@/lib/exams/storage/kurum-pdf-storage";
import { ensureQuestionPoolInit, persistQuestionPool } from "@/lib/test-maker/question-pool";
import type { QuestionPoolItem } from "@/lib/test-maker/types";

export const CLOUD_MIGRATION_KEY = "derece_cloud_migration_v4";

const MIN_INLINE_BYTES = 48_000;

type MigrationContext = {
  coachId: string;
  role: "coach" | "student" | "admin";
};

async function syncStudentsToCloud(): Promise<void> {
  const students = loadStudentsFull({ seedIfEmpty: false });
  if (!students.length) return;

  const res = await fetch("/api/students/sync", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ students, provisionAuth: true }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Öğrenci senkronizasyonu başarısız");
  }
}

function readKurumPdfMap(): Record<string, string> {
  try {
    const parsed = JSON.parse(panelGetItem(KURUM_DENEME_PDF_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeKurumPdfMap(map: Record<string, string>) {
  panelSetItem(KURUM_DENEME_PDF_KEY, JSON.stringify(map));
}

async function migrateKurumPdfsToCloud(): Promise<number> {
  const map = readKurumPdfMap();
  let migrated = 0;
  const bucketId = resolvePdfBucketId();

  for (const [examId, value] of Object.entries(map)) {
    if (!value || isCloudRef(value) || !isDataUrl(value)) continue;
    if (value.length < MIN_INLINE_BYTES) continue;

    try {
      const blob = await dataUrlToBlob(value);
      const uploaded = await uploadBlobToStorage({
        blob,
        filename: `${examId}.pdf`,
        bucketId,
        mimeType: blob.type || "application/pdf",
      });
      map[examId] = encodeCloudRef(uploaded.bucketId, uploaded.fileId);
      migrated += 1;
    } catch (err) {
      console.warn(`[migration] kurum PDF ${examId}:`, err);
    }
  }

  if (migrated > 0) writeKurumPdfMap(map);
  return migrated;
}

async function uploadPoolItemImage(
  item: QuestionPoolItem,
  coachId: string
): Promise<QuestionPoolItem> {
  if (item.imageFileId && item.imageBucketId) return item;
  if (!item.dataUrl || isCloudRef(item.dataUrl)) {
    return item;
  }

  const blob = await dataUrlToBlob(item.dataUrl);
  const uploaded = await uploadBlobToStorage({
    blob,
    filename: `${item.uuid}.jpg`,
    bucketId: resolveImageBucketId(),
    mimeType: blob.type || "image/jpeg",
  });

  const meta = { ...item, imageFileId: uploaded.fileId, imageBucketId: uploaded.bucketId };
  delete (meta as { dataUrl?: string }).dataUrl;

  try {
    await fetch("/api/migration/soru-meta", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coachId,
        entityId: item.uuid,
        payload: JSON.stringify({
          ders: item.ders,
          konu: item.konu,
          kavram: item.kavram,
          answer: item.answer,
          savedAt: item.savedAt,
          imageFileId: uploaded.fileId,
          imageBucketId: uploaded.bucketId,
        }),
      }),
    });
  } catch {
    /* koleksiyon meta isteğe bağlı */
  }

  return meta;
}

async function migrateQuestionPoolToCloud(coachId: string): Promise<number> {
  const list = await ensureQuestionPoolInit();
  if (!list.length) return 0;

  const next: QuestionPoolItem[] = [];
  let migrated = 0;

  for (const item of list) {
    const hadInline = !!(item.dataUrl && isDataUrl(item.dataUrl));
    const updated = await uploadPoolItemImage(item, coachId);
    if (hadInline && updated.imageFileId) migrated += 1;
    next.push(updated);
  }

  if (migrated > 0) await persistQuestionPool(next);
  return migrated;
}

async function migrateWrongPoolToCloud(coachId: string): Promise<number> {
  let pool: WrongQuestionRecord[] = [];
  try {
    pool = JSON.parse(panelGetItem(HATA_RECETE_LS.wrongPool) || "[]");
    if (!Array.isArray(pool)) return 0;
  } catch {
    return 0;
  }

  let migrated = 0;
  const bucketId = resolveImageBucketId();
  const next = await Promise.all(
    pool.map(async (q) => {
      if (q.imageFileId && q.imageBucketId) return q;
      const src = questionImageUrl(q);
      if (!src || isCloudRef(src) || !isDataUrl(src) || src.length < MIN_INLINE_BYTES) return q;

      try {
        const blob = await dataUrlToBlob(src);
        const uploaded = await uploadBlobToStorage({
          blob,
          filename: `${q.uuid || q.id}.jpg`,
          bucketId,
          mimeType: blob.type || "image/jpeg",
        });
        migrated += 1;
        return {
          ...q,
          dataUrl: "",
          imageFileId: uploaded.fileId,
          imageBucketId: uploaded.bucketId,
        };
      } catch (err) {
        console.warn(`[migration] hatalı soru ${q.id}:`, err);
        return q;
      }
    })
  );

  if (migrated > 0) {
    panelSetItem(HATA_RECETE_LS.wrongPool, JSON.stringify(next));
  }

  return migrated;
}

/** panel-store anahtarlarını Appwrite koleksiyonlarına taşımak için sunucu uç noktası */
async function migratePanelKeysToCollections(coachId: string): Promise<void> {
  const keys = [
    "kurum_denemeler_v1",
    "global_exams_live",
    "examResults",
    "derece_exam_results_v1",
  ];

  const payload: Record<string, string> = {};
  for (const key of keys) {
    const raw = panelGetItem(key);
    if (raw) payload[key] = raw;
  }

  if (!Object.keys(payload).length) return;

  await fetch("/api/migration/panel-keys", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coachId, keys: payload }),
  });
}

export async function runCloudMigrationIfNeeded(ctx: MigrationContext): Promise<void> {
  if (typeof window === "undefined") return;
  if (panelGetItem(CLOUD_MIGRATION_KEY) === "done") return;

  try {
    if (ctx.role === "coach" || ctx.role === "admin") {
      await syncStudentsToCloud();
      await migratePanelKeysToCollections(ctx.coachId);
    }

    await migrateKurumPdfsToCloud();
    await migrateQuestionPoolToCloud(ctx.coachId);
    await migrateWrongPoolToCloud(ctx.coachId);

    panelSetItem(CLOUD_MIGRATION_KEY, "done");
  } catch (err) {
    console.warn("[cloud-migration]", err);
  }
}
