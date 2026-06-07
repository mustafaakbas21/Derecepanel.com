import "server-only";

import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export type LatestDenemeNetsResult = {
  /** Supabase sorgusu yapıldı ve sonuç güvenilir kaynak sayılır */
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

const DENEME_ROW_LIMIT = 20;

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

function parseNetsFromRow(row: Record<string, unknown>): {
  sonTyTNet: number | null;
  sonAytNet: number | null;
} {
  const sinav = rowStr(row, "sinav", "exam_type", "sinav_tipi").toUpperCase();
  const net = rowNum(row, "net");
  let sonTyTNet = rowNum(row, "net_tyt", "tyt_net");
  let sonAytNet = rowNum(row, "net_ayt", "ayt_net");

  if (sonTyTNet == null && sinav.includes("TYT") && net != null) {
    sonTyTNet = net;
  }
  if (sonAytNet == null && sinav.includes("AYT") && net != null) {
    sonAytNet = net;
  }

  return { sonTyTNet, sonAytNet };
}

const DENEME_SELECT =
  "exam_id, exam_name, sinav, sinav_tipi, net, net_tyt, net_ayt, tyt_net, ayt_net, tarih, sinav_tarihi, saved_at, created_at, ogrenci_id, student_id";

const DATE_ORDER_COLUMNS = ["tarih", "sinav_tarihi", "saved_at", "created_at"] as const;

async function queryDenemeRows(
  studentId: string,
  orderColumn: string
): Promise<Record<string, unknown>[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("denemeler")
    .select(DENEME_SELECT)
    .or(`ogrenci_id.eq.${studentId},student_id.eq.${studentId}`)
    .order(orderColumn, { ascending: false })
    .limit(DENEME_ROW_LIMIT);

  if (error) {
    console.warn(`[Onyx] denemeler.${orderColumn} sorgusu:`, error.message);
    return [];
  }

  return (data ?? []) as Record<string, unknown>[];
}

/** Tarihe göre sıralı satırlardan ayrı ayrı en güncel TYT ve AYT netini seçer */
function aggregateLatestTyAytNets(rows: Record<string, unknown>[]): {
  sonTyTNet: number | null;
  sonAytNet: number | null;
  tytExamName?: string;
  aytExamName?: string;
  tytTarih?: string;
  aytTarih?: string;
} {
  let sonTyTNet: number | null = null;
  let sonAytNet: number | null = null;
  let tytExamName: string | undefined;
  let aytExamName: string | undefined;
  let tytTarih: string | undefined;
  let aytTarih: string | undefined;

  for (const row of rows) {
    const sinav = rowStr(row, "sinav", "exam_type", "sinav_tipi").toUpperCase();
    const examName = rowStr(row, "exam_name", "exam_id") || undefined;
    const tarih =
      rowStr(row, "tarih", "sinav_tarihi", "saved_at", "created_at") ||
      undefined;
    const { sonTyTNet: rowTyt, sonAytNet: rowAyt } = parseNetsFromRow(row);
    const net = rowNum(row, "net");

    if (sonTyTNet == null) {
      if (rowTyt != null) {
        sonTyTNet = rowTyt;
        tytExamName = examName;
        tytTarih = tarih;
      } else if (
        sinav.includes("TYT") &&
        !sinav.includes("AYT") &&
        net != null
      ) {
        sonTyTNet = net;
        tytExamName = examName;
        tytTarih = tarih;
      }
    }

    if (sonAytNet == null) {
      if (rowAyt != null) {
        sonAytNet = rowAyt;
        aytExamName = examName;
        aytTarih = tarih;
      } else if (sinav.includes("AYT") && net != null) {
        sonAytNet = net;
        aytExamName = examName;
        aytTarih = tarih;
      }
    }

    if (sonTyTNet != null && sonAytNet != null) break;
  }

  return {
    sonTyTNet,
    sonAytNet,
    tytExamName,
    aytExamName,
    tytTarih,
    aytTarih,
  };
}

/**
 * Seçili öğrencinin Supabase `denemeler` tablosundan en güncel TYT ve AYT netlerini ayrı ayrı çeker.
 * Tek satır yerine son N kayıt taranır (dashboard ile aynı mantık).
 */
export async function fetchLatestDenemeNetsFromSupabase(
  studentId: string
): Promise<LatestDenemeNetsResult> {
  const sid = String(studentId ?? "").trim();
  const empty: LatestDenemeNetsResult = {
    authoritative: false,
    durum: "bulunamadi",
    sonTyTNet: null,
    sonAytNet: null,
  };

  if (!sid || !isSupabaseConfigured()) {
    return empty;
  }

  let rows: Record<string, unknown>[] = [];

  for (const column of DATE_ORDER_COLUMNS) {
    rows = await queryDenemeRows(sid, column);
    if (rows.length > 0) break;
  }

  if (rows.length === 0) {
    return {
      ...empty,
      authoritative: true,
    };
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
    sonTyTNet:
      agg.sonTyTNet === 0 && agg.sonAytNet != null && agg.sonAytNet > 0
        ? null
        : agg.sonTyTNet,
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
  nets: Pick<
    LatestDenemeNetsResult,
    "durum" | "sonTyTNet" | "sonAytNet" | "authoritative"
  >
): string {
  if (nets.durum === "mevcut") {
    const tytKnown =
      nets.sonTyTNet != null &&
      Number.isFinite(nets.sonTyTNet) &&
      !(nets.sonTyTNet === 0 && nets.sonAytNet != null && nets.sonAytNet > 0);
    const tyt = tytKnown ? String(nets.sonTyTNet) : "kayıtta yok / bilinmiyor";
    const ayt =
      nets.sonAytNet != null && Number.isFinite(nets.sonAytNet)
        ? String(nets.sonAytNet)
        : "kayıtta yok / bilinmiyor";
    return [
      `Öğrencinin son gerçek TYT neti: ${tyt}. Son gerçek AYT neti: ${ayt}. (TYT ve AYT farklı deneme oturumlarıdır.)`,
      ONYX_DENEME_NET_HESAPLAMA_KURALI,
    ].join("\n");
  }

  if (nets.authoritative) {
    return [
      "Öğrencinin henüz sisteme girilmiş bir deneme verisi bulunmuyor. Hedef farkını hesaplarken mevcut neti bilinmiyor olarak belirt.",
      "TYT neti 0 veya varsayılan bir sayı YAZMA.",
      ONYX_DENEME_NET_HESAPLAMA_KURALI,
    ].join("\n");
  }

  return ONYX_DENEME_NET_HESAPLAMA_KURALI;
}
