import "server-only";

import { Query } from "node-appwrite";

import { APPWRITE_COLLECTION_EXAM_RESULTS, APPWRITE_DATABASE_ID } from "@/lib/appwrite/config";
import { getAdminDatabases, isAppwriteServerConfigured } from "@/lib/appwrite/server";

export type LatestDenemeNetsResult = {
  authoritative: boolean;
  durum: "mevcut" | "bulunamadi";
  sonTyTNet: number | null;
  sonAytNet: number | null;
  examName?: string;
  tarih?: string;
  tytExamName?: string;
  aytExamName?: string;
  tytTarih?: string;
  aytTarih?: string;
};

function rowStr(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function rowNum(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const v = row[key];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function aggregateLatestTyAytNets(rows: Record<string, unknown>[]) {
  let sonTyTNet: number | null = null;
  let sonAytNet: number | null = null;
  let tytExamName: string | undefined;
  let aytExamName: string | undefined;
  let tytTarih: string | undefined;
  let aytTarih: string | undefined;

  for (const row of rows) {
    const sinav = rowStr(row, "sinav", "examType").toUpperCase();
    const examName = rowStr(row, "examName", "examId") || undefined;
    const tarih = rowStr(row, "savedAt", "tarih") || undefined;
    const net = rowNum(row, "net");

    if (sonTyTNet == null && sinav.includes("TYT") && net != null) {
      sonTyTNet = net;
      tytExamName = examName;
      tytTarih = tarih;
    }
    if (sonAytNet == null && sinav.includes("AYT") && net != null) {
      sonAytNet = net;
      aytExamName = examName;
      aytTarih = tarih;
    }
    if (sonTyTNet != null && sonAytNet != null) break;
  }

  return { sonTyTNet, sonAytNet, tytExamName, aytExamName, tytTarih, aytTarih };
}

export async function fetchLatestDenemeNetsFromAppwrite(
  studentId: string
): Promise<LatestDenemeNetsResult> {
  const sid = String(studentId ?? "").trim();
  const empty: LatestDenemeNetsResult = {
    authoritative: false,
    durum: "bulunamadi",
    sonTyTNet: null,
    sonAytNet: null,
  };

  if (!sid || !isAppwriteServerConfigured()) return empty;

  const db = getAdminDatabases();
  const result = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_EXAM_RESULTS, [
    Query.limit(30),
  ]);

  const rows: Record<string, unknown>[] = [];
  for (const doc of result.documents) {
    const payload = String((doc as { payload?: string }).payload || "");
    if (!payload) continue;
    try {
      const parsed = JSON.parse(payload) as unknown;
      if (!Array.isArray(parsed)) continue;
      for (const row of parsed) {
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        if (String(r.studentId || "") === sid) rows.push(r);
      }
    } catch {
      /* ignore */
    }
  }

  rows.sort((a, b) =>
    String(b.savedAt || "").localeCompare(String(a.savedAt || ""))
  );

  if (!rows.length) {
    return { ...empty, authoritative: true };
  }

  const agg = aggregateLatestTyAytNets(rows);
  const hasNet =
    (agg.sonTyTNet != null && Number.isFinite(agg.sonTyTNet)) ||
    (agg.sonAytNet != null && Number.isFinite(agg.sonAytNet));

  if (!hasNet) {
    return {
      authoritative: true,
      durum: "bulunamadi",
      sonTyTNet: null,
      sonAytNet: null,
      examName: agg.tytExamName ?? agg.aytExamName,
      tarih: agg.tytTarih ?? agg.aytTarih,
    };
  }

  return {
    authoritative: true,
    durum: "mevcut",
    sonTyTNet: agg.sonTyTNet,
    sonAytNet: agg.sonAytNet,
    examName: agg.tytExamName ?? agg.aytExamName,
    tarih: agg.tytTarih ?? agg.aytTarih,
    tytExamName: agg.tytExamName,
    aytExamName: agg.aytExamName,
    tytTarih: agg.tytTarih,
    aytTarih: agg.aytTarih,
  };
}

export const ONYX_DENEME_NET_HESAPLAMA_KURALI = `Net farkını hesaplarken SADECE sana sistem tarafından verilen güncel netleri kullan. TYT ve AYT ayrı oturumlardır — AYT netini TYT yerine yazma. Güncel TYT neti verilmemişse mevcut TYT neti "bilinmiyor" de; 0 yazma.`;

export function buildDenemeNetPromptBlock(
  nets: Pick<LatestDenemeNetsResult, "durum" | "sonTyTNet" | "sonAytNet" | "authoritative">
): string {
  if (nets.durum === "mevcut") {
    const tyt =
      nets.sonTyTNet != null && Number.isFinite(nets.sonTyTNet)
        ? String(nets.sonTyTNet)
        : "kayıtta yok / bilinmiyor";
    const ayt =
      nets.sonAytNet != null && Number.isFinite(nets.sonAytNet)
        ? String(nets.sonAytNet)
        : "kayıtta yok / bilinmiyor";
    return [
      `Öğrencinin son gerçek TYT neti: ${tyt}. Son gerçek AYT neti: ${ayt}.`,
      ONYX_DENEME_NET_HESAPLAMA_KURALI,
    ].join("\n");
  }

  if (nets.authoritative) {
    return [
      "Öğrencinin henüz sisteme girilmiş bir deneme verisi bulunmuyor.",
      ONYX_DENEME_NET_HESAPLAMA_KURALI,
    ].join("\n");
  }

  return ONYX_DENEME_NET_HESAPLAMA_KURALI;
}
