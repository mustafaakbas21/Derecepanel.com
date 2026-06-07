import type { OnyxCareerCounseling } from "@/lib/onyx/career-counseling";
import type { OnyxDeepErrorDiagnosis } from "@/lib/onyx/deep-error-diagnosis";
import type { OnyxSolveStructured } from "@/lib/onyx/solve-types";
import {
  isMarkdownSolveReply,
  markdownSolveReplyToVisionData,
} from "@/lib/onyx/vision-solve-display";
import { buildOnyxKonuTakipHref } from "@/lib/onyx/konu-takip-link";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import { coerceMentalSkillData } from "@/lib/onyx/mental-skill-coerce";
import { normalizeAnalyticsSkillData } from "@/lib/onyx/analytics-normalize";
import { clampOnyxZorluk } from "@/lib/onyx/zorluk-display";
import type {
  AnalyticsSkillData,
  CareerSkillData,
  ChatSkillData,
  OnyxSkillResponse,
  StrategySkillData,
  VisionCozumDetay,
  VisionSkillData,
  VisionOsymAnalizi,
} from "@/lib/onyx/skill-types";

export function careerCounselingToSkillData(
  c: OnyxCareerCounseling
): CareerSkillData {
  return {
    vizyon: c.meslekAnalizi.gelecekVizyonu,
    mevcutDurum: c.netAnaliziVeAlternatifler.mevcutDurum,
    alternatifler:
      c.netAnaliziVeAlternatifler.hedefeYakinAlternatifler.map((a) => ({
        bolum: a.bolum,
        nedenUygun: a.nedenUygun,
        tabanPuani: a.tabanPuani,
        isBulma: a.isBulma,
        sektorTrendi: a.sektorTrendi,
      })),
    parlakBolumler:
      c.netAnaliziVeAlternatifler.farkliAmaGelecegiParlakBölümler.map((a) => ({
        bolum: a.bolum,
        nedenUygun: a.nedenUygun,
        tabanPuani: a.tabanPuani,
        isBulma: a.isBulma,
        sektorTrendi: a.sektorTrendi,
      })),
    avantajlar: c.meslekAnalizi.avantajVeDezavantajlar,
    onyxTavsiyesi: c.onyxTavsiyesi,
  };
}

export function careerCounselingToSkillResponse(
  c: OnyxCareerCounseling
): OnyxSkillResponse {
  return { type: "career", data: careerCounselingToSkillData(c) };
}

export function skillDataToCareerCounseling(
  data: CareerSkillData
): OnyxCareerCounseling {
  return {
    meslekAnalizi: {
      gelecekVizyonu: data.vizyon,
      avantajVeDezavantajlar: data.avantajlar?.length
        ? data.avantajlar
        : ["—"],
    },
    netAnaliziVeAlternatifler: {
      mevcutDurum: data.mevcutDurum,
      hedefeYakinAlternatifler: data.alternatifler.map((a) => ({
        bolum: a.bolum,
        nedenUygun: a.nedenUygun,
        tabanPuani: a.tabanPuani,
      })),
      farkliAmaGelecegiParlakBölümler: (data.parlakBolumler ?? []).map((a) => ({
        bolum: a.bolum,
        nedenUygun: a.nedenUygun,
        tabanPuani: a.tabanPuani,
      })),
    },
    onyxTavsiyesi: data.onyxTavsiyesi ?? "",
  };
}

export function deepDiagnosisToVisionData(
  d: OnyxDeepErrorDiagnosis,
  role: OnyxRole = "student"
): VisionSkillData {
  return {
    soruOnAnalizi: {
      sinavBolumu: d.soruOnAnalizi.sinavBolumu,
      dersAdi: d.soruOnAnalizi.dersAdi,
      konuAdi: d.soruOnAnalizi.konuAdi,
      kavramAdi: d.soruOnAnalizi.kavramAdi,
      zorlukSeviyesi: d.soruOnAnalizi.zorlukSeviyesi,
      zorlukNotu: d.soruOnAnalizi.zorlukNotu,
      yapamamaSebepleri: d.soruOnAnalizi.yapamamaSebepleri,
      osymAnalizi: d.soruOnAnalizi.osymAnalizi,
    },
    cozum: d.cozumAdimlari,
    cozumDetay: {
      dersTipi: d.cozumDetay.dersTipi,
      sinavBolumu: d.cozumDetay.sinavBolumu,
      hocaAcilis: d.cozumDetay.hocaAcilis,
      temelKural: d.cozumDetay.temelKural,
      miniOrnek: d.cozumDetay.miniOrnek,
      kaynakAlintisi: d.cozumDetay.kaynakAlintisi,
      verilenler: d.cozumDetay.verilenler,
      sekilAnalizi: d.cozumDetay.sekilAnalizi,
      osymTuzagi: d.cozumDetay.osymTuzagi,
      nihaiCevap: d.cozumDetay.nihaiCevap,
      dogrulama: d.cozumDetay.dogrulama,
    },
    hata: d.hataAnalizi.kökNeden,
    hataTipi: d.hataAnalizi.hataTipi,
    eksikKavram: d.hataAnalizi.eksikKavram,
    link: buildOnyxKonuTakipHref(d, role) ?? undefined,
    onyxMesaji: d.aksiyonPlani.OnyxMesaji,
  };
}

export function deepDiagnosisToSkillResponse(
  d: OnyxDeepErrorDiagnosis,
  role?: OnyxRole
): OnyxSkillResponse {
  return { type: "vision", data: deepDiagnosisToVisionData(d, role) };
}

function splitStructuredCozumToSteps(cozum: string): string[] {
  const text = String(cozum ?? "").trim();
  if (!text) return [];

  const byNumberedLines = text
    .split(/\n(?=\d+\.\s)/)
    .map((chunk) => chunk.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  if (byNumberedLines.length >= 2) return byNumberedLines;

  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function mapHataKoduToTip(kod: string): string {
  const k = kod.trim().toUpperCase();
  if (k.includes("ISLEM")) return "İşlem Hatası";
  if (k.includes("DIKKAT")) return "Okuma/Dikkat Hatası";
  if (k.includes("KONU")) return "Bilgi Eksikliği";
  if (k.includes("KAVRAM")) return "Kavram Yanılgısı";
  return "Kavram Yanılgısı";
}

export function buildVisionSkillFromStructured(
  structured: OnyxSolveStructured,
  role?: OnyxRole
): OnyxSkillResponse {
  if (structured.deepDiagnosis) {
    return deepDiagnosisToSkillResponse(structured.deepDiagnosis, role);
  }

  const steps = splitStructuredCozumToSteps(structured.cozum);
  const konu = structured.konu_basligi.trim() || "İlgili konu";

  return {
    type: "vision",
    data: {
      soruOnAnalizi: {
        dersAdi: "TYT Matematik",
        konuAdi: konu,
        kavramAdi: konu,
        zorlukSeviyesi: structured.zorluk_seviyesi,
        yapamamaSebepleri: [
          "Konu tekrarı veya kavram eşleştirmesi eksik olabilir.",
          "Soru kökündeki verilenler ile istenen karıştırılmış olabilir.",
        ],
        osymAnalizi: {
          durum: "kismen",
          aciklama:
            "Bu kazanım YKS müfredatında yer alır; ÖSYM benzer mantıkla sorabilir.",
        },
      },
      cozum: steps.length ? steps : [structured.cozum],
      hata:
        structured.coach_insight?.trim() ||
        `Bu soruda ${konu} konusunda takılma olabilir.`,
      hataTipi: mapHataKoduToTip(structured.hata_kodu),
      eksikKavram: konu,
    },
  };
}

/** Soru çözümü — tek Vision kart UI (JSON, legacy veya markdown) */
export function resolveVisionSolveSkillResponse(input: {
  deepErrorDiagnosis?: OnyxDeepErrorDiagnosis;
  structured?: OnyxSolveStructured;
  reply?: string;
  role?: OnyxRole;
}): OnyxSkillResponse | null {
  if (input.deepErrorDiagnosis) {
    return deepDiagnosisToSkillResponse(input.deepErrorDiagnosis, input.role);
  }
  if (input.structured) {
    return buildVisionSkillFromStructured(input.structured, input.role);
  }
  const fromMarkdown = input.reply
    ? markdownSolveReplyToVisionData(input.reply)
    : null;
  if (fromMarkdown) {
    return { type: "vision", data: fromMarkdown };
  }
  return null;
}

function parseVisionOsymDurumu(raw: unknown): VisionOsymAnalizi["durum"] {
  const t = String(raw ?? "kismen").trim().toLowerCase();
  if (t === "evet" || t === "kismen" || t === "nadir" || t === "hayir") {
    return t;
  }
  return "kismen";
}

function parseVisionSoruOnAnalizi(
  raw: unknown
): VisionSkillData["soruOnAnalizi"] | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const dersAdi = String(o.dersAdi ?? "").trim();
  const konuAdi = String(o.konuAdi ?? "").trim();
  const kavramAdi = String(o.kavramAdi ?? konuAdi).trim();
  const sebeplerRaw = o.yapamamaSebepleri ?? o.yapamama_sebepleri;
  const yapamamaSebepleri = Array.isArray(sebeplerRaw)
    ? sebeplerRaw.map((s) => String(s).trim()).filter(Boolean).slice(0, 4)
    : [];
  const osymRaw = (o.osymAnalizi ?? o.osym_analizi) as
    | Record<string, unknown>
    | undefined;
  const aciklama = osymRaw ? String(osymRaw.aciklama ?? "").trim() : "";
  const zorlukRaw = o.zorlukSeviyesi ?? o.zorluk_seviyesi ?? o.zorluk;
  const zorlukSeviyesi = zorlukRaw != null ? clampOnyxZorluk(zorlukRaw) : 3;
  const zorlukNotu = String(o.zorlukNotu ?? o.zorluk_notu ?? "").trim() || undefined;
  if (!dersAdi || !konuAdi || yapamamaSebepleri.length === 0 || !aciklama) {
    return undefined;
  }
  return {
    sinavBolumu: parseSinavBolumuAdapter(o.sinavBolumu ?? o.sinav_bolumu),
    dersAdi,
    konuAdi,
    kavramAdi,
    zorlukSeviyesi,
    zorlukNotu,
    yapamamaSebepleri,
    osymAnalizi: {
      durum: parseVisionOsymDurumu(osymRaw?.durum),
      aciklama,
      siklikNotu: osymRaw
        ? String(osymRaw.siklikNotu ?? "").trim() || undefined
        : undefined,
    },
  };
}

function parseSinavBolumuAdapter(
  raw: unknown
): "TYT" | "AYT" | "YDT" | undefined {
  const t = String(raw ?? "").trim().toUpperCase();
  if (t === "TYT" || t === "AYT" || t === "YDT") return t;
  return undefined;
}

function parseVisionCozumDetay(raw: unknown): VisionCozumDetay | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const nihaiCevap = String(o.nihaiCevap ?? o.cevap ?? "").trim();
  const dogrulama = String(o.dogrulama ?? o.kontrol ?? "").trim();
  const osymTuzagi = String(o.osymTuzagi ?? o.osym_tuzagi ?? "").trim();
  if (!nihaiCevap || !dogrulama || !osymTuzagi) return undefined;
  const dersTipiRaw = String(o.dersTipi ?? "sozel").trim().toLowerCase();
  const dersTipi =
    dersTipiRaw === "sayisal" || dersTipiRaw === "dil" ? dersTipiRaw : "sozel";
  const verilenRaw = o.verilenler ?? o.verilen;
  const verilenler = Array.isArray(verilenRaw)
    ? verilenRaw.map((v) => String(v).trim()).filter(Boolean)
    : [];
  return {
    dersTipi,
    sinavBolumu: parseSinavBolumuAdapter(o.sinavBolumu ?? o.sinav_bolumu),
    hocaAcilis: String(o.hocaAcilis ?? o.hoca_acilis ?? "").trim() || undefined,
    temelKural: String(o.temelKural ?? "").trim() || undefined,
    miniOrnek: String(o.miniOrnek ?? o.mini_ornek ?? "").trim() || undefined,
    kaynakAlintisi:
      String(o.kaynakAlintisi ?? o.kaynak_alintisi ?? "").trim() || undefined,
    verilenler,
    sekilAnalizi: String(o.sekilAnalizi ?? "").trim() || undefined,
    osymTuzagi,
    nihaiCevap,
    dogrulama,
  };
}

export function chatTextToSkillResponse(text: string): OnyxSkillResponse {
  return { type: "chat", data: { text } };
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isSkillResponseShape(
  obj: unknown
): obj is { type: string; data: unknown } {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.type === "string" &&
    o.data !== undefined &&
    typeof o.data === "object"
  );
}

/** Model çıktısından `{ type, data }` zarfını ayıkla */
export function parseSkillResponseFromText(
  text: string
): OnyxSkillResponse | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fenced =
    trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ??
    trimmed.match(/\{[\s\S]*\}/)?.[0];
  const candidate = fenced?.trim() ?? trimmed;

  let obj: unknown = tryParseJson(candidate);
  if (!obj) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      obj = tryParseJson(trimmed.slice(start, end + 1));
    }
  }
  if (!isSkillResponseShape(obj)) return null;

  const type = String(obj.type).trim();
  const data = obj.data as Record<string, unknown>;

  switch (type) {
    case "vision": {
      const cozum = Array.isArray(data.cozum)
        ? data.cozum.map((s) => String(s).trim()).filter(Boolean)
        : [];
      const hata = String(data.hata ?? "").trim();
      if (!cozum.length && !hata) return null;
      return {
        type: "vision",
        data: {
          soruOnAnalizi: parseVisionSoruOnAnalizi(
            data.soruOnAnalizi ?? data.soru_on_analizi
          ),
          cozumDetay: parseVisionCozumDetay(data.cozumDetay ?? data.cozum_detay),
          cozum,
          hata,
          hataTipi: String(data.hataTipi ?? "").trim() || undefined,
          eksikKavram: String(data.eksikKavram ?? "").trim() || undefined,
          link: String(data.link ?? "").trim() || undefined,
          onyxMesaji: String(data.onyxMesaji ?? "").trim() || undefined,
        },
      };
    }
    case "strategy": {
      const tasks = Array.isArray(data.haftalikGorevler)
        ? data.haftalikGorevler
        : [];
      const bransRaw = data.bransAnalizi ?? data.brans_analizi;
      const bransAnalizi = Array.isArray(bransRaw)
        ? bransRaw
            .map((b) => {
              const row = b as Record<string, unknown>;
              const ders = String(row.ders ?? "").trim();
              const gerekce = String(row.gerekce ?? row.aciklama ?? "").trim();
              if (!ders || !gerekce) return null;
              const oncelikRaw = String(row.oncelik ?? "orta").toLowerCase();
              const oncelik =
                oncelikRaw === "kritik" || oncelikRaw === "yuksek"
                  ? oncelikRaw
                  : "orta";
              return {
                ders,
                mevcutNet:
                  row.mevcutNet != null ? Number(row.mevcutNet) : undefined,
                hedefNet:
                  row.hedefNet != null ? Number(row.hedefNet) : undefined,
                oncelik: oncelik as "kritik" | "yuksek" | "orta",
                gerekce,
              };
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x))
        : undefined;

      const hedefRaw = data.hedefAnalizi ?? data.hedef_analizi;
      let hedefAnalizi: StrategySkillData["hedefAnalizi"];
      if (hedefRaw && typeof hedefRaw === "object" && !Array.isArray(hedefRaw)) {
        const h = hedefRaw as Record<string, unknown>;
        const prog = (h.program ?? h.programa) as Record<string, unknown> | undefined;
        if (prog && typeof prog === "object") {
          hedefAnalizi = {
            program: {
              universite: String(prog.universite ?? "").trim() || "—",
              bolum: String(prog.bolum ?? "").trim() || "—",
              puanTipi: String(prog.puanTipi ?? prog.puan_tipi ?? "").trim() || undefined,
              tabanPuani:
                String(prog.tabanPuani ?? prog.taban ?? "").trim() || undefined,
              basariSirasi:
                String(prog.basariSirasi ?? prog.sira ?? "").trim() || undefined,
              atlasKaynak: prog.atlasKaynak === true,
            },
            mevcutToplamNet: Number(h.mevcutToplamNet ?? h.mevcut_net) || 0,
            hedefToplamNet: Number(h.hedefToplamNet ?? h.hedef_net) || 0,
            netFarki: Number(h.netFarki ?? h.net_farki) || 0,
            gerçekcilik:
              String(h.gerçekcilik ?? h.gerceklik ?? "orta") === "yuksek"
                ? "yuksek"
                : String(h.gerçekcilik ?? h.gerceklik ?? "") === "dusuk"
                  ? "dusuk"
                  : String(h.gerçekcilik ?? h.gerceklik ?? "") === "veri_yok"
                    ? "veri_yok"
                    : "orta",
            analiz: String(h.analiz ?? "").trim() || "—",
            tahminiSure: String(h.tahminiSure ?? h.tahmini_sure ?? "").trim() || undefined,
          };
        }
      }

      const oncelikliRaw = data.oncelikliKonular ?? data.oncelikli_konular;
      const oncelikliKonular = Array.isArray(oncelikliRaw)
        ? oncelikliRaw.map((k) => String(k).trim()).filter(Boolean).slice(0, 8)
        : undefined;

      return {
        type: "strategy",
        data: {
          mevcutNet: Number(data.mevcutNet) || 0,
          hedefNet: Number(data.hedefNet) || 0,
          puanTipi: String(data.puanTipi ?? data.puan_tipi ?? "").trim() || undefined,
          ozet: String(data.ozet ?? "").trim() || undefined,
          hedefAnalizi,
          bransAnalizi,
          oncelikliKonular,
          koçNotu: String(data.koçNotu ?? data.kocNotu ?? data.koc_notu ?? "").trim() || undefined,
          haftalikGorevler: tasks
            .map((t, i) => {
              const row = t as Record<string, unknown>;
              const baslik = String(row.baslik ?? row.title ?? "").trim();
              if (!baslik) return null;
              const oncelikRaw = String(row.oncelik ?? "").toLowerCase();
              const oncelik =
                oncelikRaw === "kritik" || oncelikRaw === "yuksek"
                  ? (oncelikRaw as "kritik" | "yuksek")
                  : oncelikRaw === "orta"
                    ? ("orta" as const)
                    : undefined;
              return {
                id: String(row.id ?? `g-${i}`),
                baslik,
                aciklama: String(row.aciklama ?? row.description ?? "").trim() || undefined,
                gun:
                  typeof row.gun === "number"
                    ? row.gun
                    : Number(row.dayIndex) || 0,
                sure: String(row.sure ?? row.duration ?? "").trim() || undefined,
                oncelik,
              };
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x)),
        },
      };
    }
    case "analytics": {
      const normalized = normalizeAnalyticsSkillData(data);
      if (!normalized) return null;
      return { type: "analytics", data: normalized };
    }
    case "youtube": {
      let ozet = String(data.ozet ?? "").trim();
      if (!ozet) {
        const notlarRaw = data.notlar ?? data.notes;
        if (Array.isArray(notlarRaw) && notlarRaw.length > 0) {
          ozet = notlarRaw
            .map((n) => {
              const row = n as Record<string, unknown>;
              const icerik = String(row.icerik ?? row.content ?? "").trim();
              const baslik = String(row.baslik ?? row.title ?? "").trim();
              return baslik && icerik ? `${baslik}: ${icerik}` : icerik || baslik;
            })
            .filter(Boolean)
            .join("\n\n");
        }
      }

      const kavramlarRaw = data.kritikKavramlar ?? data.kritikKavram;
      let kritikKavramlar = Array.isArray(kavramlarRaw)
        ? kavramlarRaw
            .map((k) => {
              const row = k as Record<string, unknown>;
              const isim = String(row.isim ?? row.ad ?? row.name ?? "").trim();
              const aciklama = String(
                row.aciklama ?? row.description ?? row.icerik ?? ""
              ).trim();
              const osymTuzagi = String(
                row.osymTuzagi ?? row.tuzak ?? row.osym ?? ""
              ).trim();
              if (!isim && !aciklama) return null;
              return {
                isim: isim || "Kavram",
                aciklama: aciklama || "—",
                osymTuzagi: osymTuzagi || "ÖSYM genelde kavram karışıklığı veya işlem hatası üzerinden sorar.",
              };
            })
            .filter(
              (x): x is { isim: string; aciklama: string; osymTuzagi: string } =>
                Boolean(x)
            )
        : [];

      if (kritikKavramlar.length === 0) {
        const legacyForm = data.kritikFormuller ?? data.formulOzetleri;
        if (Array.isArray(legacyForm)) {
          kritikKavramlar = legacyForm
            .map((s) => String(s).trim())
            .filter(Boolean)
            .map((isim) => ({
              isim,
              aciklama: "Videoda geçen kritik kural veya formül.",
              osymTuzagi:
                "ÖSYM bu kavramı genelde yanlış uygulama veya eksik bilgi ile tuzaklar.",
            }));
        }
      }

      const testRaw = data.anlamaKontrolu ?? data.miniTest ?? data.test;
      const anlamaKontrolu = Array.isArray(testRaw)
        ? testRaw
            .map((t) => {
              const row = t as Record<string, unknown>;
              const soru = String(row.soru ?? row.question ?? "").trim();
              if (!soru) return null;
              const cevap = String(
                row.cevap ?? row.dogruCevap ?? row.cozum ?? ""
              ).trim();
              return { soru, cevap: cevap || "Çözüm adımlarını tekrar et." };
            })
            .filter((x): x is { soru: string; cevap: string } => Boolean(x))
        : [];

      if (!ozet && kritikKavramlar.length === 0 && anlamaKontrolu.length === 0) {
        return null;
      }

      return {
        type: "youtube",
        data: {
          ozet: ozet || "Video özeti üretilemedi; konuyu tekrar sorun.",
          kritikKavramlar,
          anlamaKontrolu,
          videoBaslik: String(data.videoBaslik ?? "").trim() || undefined,
          videoUrl: String(data.videoUrl ?? "").trim() || undefined,
        },
      };
    }
    case "mental": {
      const coerced = coerceMentalSkillData(data);
      if (!coerced) return null;
      return { type: "mental", data: coerced };
    }
    case "career": {
      const vizyon = String(data.vizyon ?? "").trim();
      if (!vizyon) return null;
      const alts = Array.isArray(data.alternatifler) ? data.alternatifler : [];
      return {
        type: "career",
        data: {
          vizyon,
          mevcutDurum: String(data.mevcutDurum ?? "").trim() || "—",
          alternatifler: alts
            .map((a) => {
              const row = a as Record<string, unknown>;
              const bolum = String(row.bolum ?? "").trim();
              const nedenUygun = String(row.nedenUygun ?? "").trim();
              if (!bolum) return null;
              return {
                bolum,
                nedenUygun: nedenUygun || "—",
                tabanPuani: String(row.tabanPuani ?? "").trim() || undefined,
              };
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x)),
          onyxTavsiyesi: String(data.onyxTavsiyesi ?? "").trim() || undefined,
        },
      };
    }
    case "chat":
    default:
      return {
        type: "chat",
        data: { text: String(data.text ?? trimmed).trim() },
      };
  }
}

export function resolveDisplaySkillResponse(input: {
  onyxResponse?: OnyxSkillResponse | null;
  careerCounseling?: OnyxCareerCounseling;
  deepErrorDiagnosis?: OnyxDeepErrorDiagnosis;
  reply?: string;
  role?: OnyxRole;
}): OnyxSkillResponse | undefined {
  if (input.onyxResponse?.type && input.onyxResponse.type !== "chat") {
    return input.onyxResponse;
  }

  const visionSolve = resolveVisionSolveSkillResponse({
    deepErrorDiagnosis: input.deepErrorDiagnosis,
    reply: input.reply,
    role: input.role,
  });
  if (visionSolve) return visionSolve;

  if (input.careerCounseling) {
    return careerCounselingToSkillResponse(input.careerCounseling);
  }

  const parsed = input.reply ? parseSkillResponseFromText(input.reply) : null;
  if (parsed?.type && parsed.type !== "chat") return parsed;

  if (input.reply && isMarkdownSolveReply(input.reply)) {
    const markdownVision = markdownSolveReplyToVisionData(input.reply);
    if (markdownVision) return { type: "vision", data: markdownVision };
  }

  if (parsed) return parsed;
  if (input.reply?.trim()) {
    return chatTextToSkillResponse(input.reply);
  }
  return undefined;
}

export type { StrategySkillData, AnalyticsSkillData, ChatSkillData, VisionSkillData };
