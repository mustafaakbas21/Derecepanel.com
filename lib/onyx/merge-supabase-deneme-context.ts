import "server-only";

import type { LatestDenemeNetsResult } from "@/lib/appwrite/deneme-nets-server";

/** Supabase deneme sonucunu Onyx bağlamına yazar; yetkili kaynak ise istemci mock netlerini temizler */
export function mergeSupabaseDenemeIntoContext(
  contextData: unknown,
  nets: LatestDenemeNetsResult
): Record<string, unknown> {
  const base =
    contextData && typeof contextData === "object" && !Array.isArray(contextData)
      ? { ...(contextData as Record<string, unknown>) }
      : {};

  if (!nets.authoritative) {
    return base;
  }

  base.supabaseSonDeneme = {
    durum: nets.durum,
    sonTyTNet: nets.sonTyTNet,
    sonAytNet: nets.sonAytNet,
    examName: nets.examName,
    tarih: nets.tarih,
    kaynak: "appwrite",
  };

  if (nets.durum === "mevcut") {
    base.kurumsalDenemeOzeti = {
      sonTyTNet: nets.sonTyTNet,
      sonAytNet: nets.sonAytNet,
      sonDenemeTarihi: nets.tarih ?? "",
      denemeSayisi: [nets.sonTyTNet, nets.sonAytNet].filter(
        (n) => n != null && Number.isFinite(n)
      ).length,
      kaynak: "appwrite",
    };

    const sonUcDeneme: Record<string, unknown>[] = [];
    if (nets.sonTyTNet != null) {
      sonUcDeneme.push({
        ad: nets.tytExamName || nets.examName || "Son TYT denemesi",
        sinav: "TYT",
        net: nets.sonTyTNet,
        tarih: nets.tytTarih ?? nets.tarih ?? "",
        kaynak: "appwrite",
      });
    }
    if (nets.sonAytNet != null) {
      sonUcDeneme.push({
        ad: nets.aytExamName || nets.examName || "Son AYT denemesi",
        sinav: "AYT",
        net: nets.sonAytNet,
        tarih: nets.aytTarih ?? nets.tarih ?? "",
        kaynak: "appwrite",
      });
    }
    if (sonUcDeneme.length > 0) {
      base.sonUcDeneme = sonUcDeneme;
    }
    return base;
  }

  delete base.kurumsalDenemeOzeti;
  base.sonUcDeneme = [];
  return base;
}
