import { z } from "zod";

import type { OnyxCareerCounseling } from "@/lib/onyx/career-types";
import { preprocessCareerCounseling } from "@/lib/onyx/career-counseling-coerce";
import {
  normalizeStrategyGerceklik,
  normalizeStrategyOncelik,
  preprocessStrategySkillEnvelope,
} from "@/lib/onyx/strategy-skill-coerce";
import { preprocessMentalSkillEnvelope } from "@/lib/onyx/mental-skill-coerce";
import type { OnyxSkillResponse, OnyxSkillType } from "@/lib/onyx/skill-types";

const careerAlternativeSchema = z.object({
  bolum: z.string(),
  nedenUygun: z.string(),
  tabanPuani: z.string().optional(),
  isBulma: z.enum(["yüksek", "orta", "değişken"]).optional(),
  sektorTrendi: z.enum(["yükselen", "stabil", "dönüşümde"]).optional(),
});

export const onyxCareerCounselingSchema = z.preprocess(
  preprocessCareerCounseling,
  z.object({
    meslekAnalizi: z.object({
      gelecekVizyonu: z.string(),
      avantajVeDezavantajlar: z.array(z.string()),
    }),
    netAnaliziVeAlternatifler: z.object({
      mevcutDurum: z.string(),
      hedefeYakinAlternatifler: z.array(careerAlternativeSchema),
      farkliAmaGelecegiParlakBölümler: z.array(careerAlternativeSchema),
    }),
    onyxTavsiyesi: z.string(),
  })
) as z.ZodType<OnyxCareerCounseling>;

const analyticsSkillDataSchema = z
  .object({
    analiz: z
      .object({
        gercekci_durum_ozeti: z.string(),
        kirmizi_alarm_durumu: z.string(),
      })
      .strict(),
    grafik_verisi_icin_trend: z
      .array(
        z
          .object({
            tarih: z.string(),
            sinav: z.string(),
            net: z.number(),
          })
          .strict()
      )
      .max(5),
    aksiyon_recetesi: z.array(z.string()).max(5),
  })
  .strict();

const strategyHedefProgramSchema = z.object({
  universite: z.string(),
  bolum: z.string(),
  puanTipi: z.string().optional(),
  tabanPuani: z.string().optional(),
  basariSirasi: z.string().optional(),
  atlasKaynak: z.boolean().optional(),
});

const strategyHedefAnaliziSchema = z.object({
  program: strategyHedefProgramSchema,
  mevcutToplamNet: z.coerce.number(),
  hedefToplamNet: z.coerce.number(),
  netFarki: z.coerce.number(),
  gerçekcilik: z.preprocess(
    normalizeStrategyGerceklik,
    z.enum(["yuksek", "orta", "dusuk", "veri_yok"])
  ),
  analiz: z.string(),
  tahminiSure: z.string().optional(),
});

const strategyBransSatiriSchema = z.object({
  ders: z.string(),
  mevcutNet: z.coerce.number().optional(),
  hedefNet: z.coerce.number().optional(),
  oncelik: z.preprocess(
    normalizeStrategyOncelik,
    z.enum(["kritik", "yuksek", "orta"])
  ),
  gerekce: z.string(),
});

const strategySkillDataSchema = z.object({
  mevcutNet: z.coerce.number(),
  hedefNet: z.coerce.number(),
  sonTyTNet: z.coerce.number().nullable().optional(),
  sonAytNet: z.coerce.number().nullable().optional(),
  hedefTyTNet: z.coerce.number().optional(),
  puanTipi: z.string().optional(),
  ozet: z.string().optional(),
  hedefAnalizi: strategyHedefAnaliziSchema.optional(),
  bransAnalizi: z.array(strategyBransSatiriSchema).max(8).optional(),
  oncelikliKonular: z.array(z.string()).max(8).optional(),
  koçNotu: z.string().optional(),
  haftalikGorevler: z
    .array(
      z.object({
        id: z.string(),
        baslik: z.string(),
        aciklama: z.string().optional(),
        gun: z.coerce.number().optional(),
        sure: z.string().optional(),
        oncelik: z.preprocess(
          normalizeStrategyOncelik,
          z.enum(["kritik", "yuksek", "orta"])
        ).optional(),
      })
    )
    .max(10),
});

const visionOsymAnaliziSchema = z
  .object({
    durum: z.enum(["evet", "kismen", "nadir", "hayir"]),
    aciklama: z.string(),
    siklikNotu: z.string().optional(),
  })
  .strict();

const visionSoruOnAnaliziSchema = z
  .object({
    sinavBolumu: z.enum(["TYT", "AYT", "YDT"]).optional(),
    dersAdi: z.string(),
    konuAdi: z.string(),
    kavramAdi: z.string(),
    zorlukSeviyesi: z.number().int().min(1).max(5),
    zorlukNotu: z.string().optional(),
    yapamamaSebepleri: z.array(z.string()).min(2).max(4),
    osymAnalizi: visionOsymAnaliziSchema,
  })
  .strict();

const visionCozumDetaySchema = z
  .object({
    dersTipi: z.enum(["sayisal", "sozel", "dil"]),
    sinavBolumu: z.enum(["TYT", "AYT", "YDT"]).optional(),
    hocaAcilis: z.string().optional(),
    temelKural: z.string().optional(),
    miniOrnek: z.string().optional(),
    kaynakAlintisi: z.string().optional(),
    verilenler: z.array(z.string()),
    sekilAnalizi: z.string().optional(),
    osymTuzagi: z.string(),
    nihaiCevap: z.string(),
    dogrulama: z.string(),
  })
  .strict();

const visionSkillDataSchema = z
  .object({
    soruOnAnalizi: visionSoruOnAnaliziSchema.optional(),
    cozumDetay: visionCozumDetaySchema.optional(),
    cozum: z.array(z.string()).min(1),
    hata: z.string(),
    hataTipi: z.string().optional(),
    eksikKavram: z.string().optional(),
    link: z.string().optional(),
    onyxMesaji: z.string().optional(),
  })
  .strict();

const youtubeSkillDataSchema = z
  .object({
    ozet: z.string(),
    kritikKavramlar: z
      .array(
        z
          .object({
            isim: z.string(),
            aciklama: z.string(),
            osymTuzagi: z.string(),
          })
          .strict()
      )
      .min(1),
    anlamaKontrolu: z
      .array(
        z
          .object({
            soru: z.string(),
            cevap: z.string(),
          })
          .strict()
      )
      .min(1),
    videoBaslik: z.string().optional(),
    videoUrl: z.string().optional(),
  })
  .strict();

const mentalBdtSchema = z
  .object({
    carpitma: z.string(),
    dusunceKaydi: z.string(),
    alternatifDusunce: z.string(),
  })
  .strict();

const mentalNefesSchema = z
  .object({
    baslik: z.string(),
    adimlar: z.array(z.string()).min(1),
  })
  .strict();

const mentalSkillDataSchema = z
  .object({
    dostAcilisi: z.string(),
    duyguHaritasi: z.string(),
    tespitEdilenDuygu: z.string(),
    bdtCalismasi: mentalBdtSchema,
    terapotikTelkin: z.string(),
    nefesProtokolu: mentalNefesSchema,
    acilAksiyonRecetesi: z.array(z.string()).min(1),
    kanitlar: z.array(z.string()),
    dostKapanisi: z.string(),
  })
  .strict();

const careerSkillDataSchema = z
  .object({
    vizyon: z.string(),
    mevcutDurum: z.string(),
    alternatifler: z.array(careerAlternativeSchema),
    parlakBolumler: z.array(careerAlternativeSchema).optional(),
    avantajlar: z.array(z.string()).optional(),
    onyxTavsiyesi: z.string().optional(),
  })
  .strict();

const chatSkillDataSchema = z
  .object({
    text: z.string(),
  })
  .strict();

export const analyticsSkillResponseSchema = z
  .object({
    type: z.literal("analytics"),
    data: analyticsSkillDataSchema,
  })
  .strict();

export const strategySkillResponseSchema = z.preprocess(
  preprocessStrategySkillEnvelope,
  z.object({
    type: z.literal("strategy"),
    data: strategySkillDataSchema,
  })
) as z.ZodType<{ type: "strategy"; data: z.infer<typeof strategySkillDataSchema> }>;

export const visionSkillResponseSchema = z
  .object({
    type: z.literal("vision"),
    data: visionSkillDataSchema,
  })
  .strict();

export const youtubeSkillResponseSchema = z
  .object({
    type: z.literal("youtube"),
    data: youtubeSkillDataSchema,
  })
  .strict();

export const mentalSkillResponseSchema = z.preprocess(
  preprocessMentalSkillEnvelope,
  z.object({
    type: z.literal("mental"),
    data: mentalSkillDataSchema,
  })
) as z.ZodType<{ type: "mental"; data: z.infer<typeof mentalSkillDataSchema> }>;

export const careerSkillResponseSchema = z
  .object({
    type: z.literal("career"),
    data: careerSkillDataSchema,
  })
  .strict();

export const chatSkillResponseSchema = z
  .object({
    type: z.literal("chat"),
    data: chatSkillDataSchema,
  })
  .strict();

const SKILL_RESPONSE_SCHEMAS: Record<
  Exclude<OnyxSkillType, "vision_solve">,
  z.ZodType<OnyxSkillResponse>
> = {
  strategy: strategySkillResponseSchema,
  analytics: analyticsSkillResponseSchema,
  career: careerSkillResponseSchema,
  youtube_assistant: youtubeSkillResponseSchema,
  mental_coach: mentalSkillResponseSchema,
  chat: chatSkillResponseSchema,
};

export function getOnyxSkillResponseSchema(
  skillType: OnyxSkillType
): z.ZodType<OnyxSkillResponse> {
  if (skillType === "vision_solve") {
    return visionSkillResponseSchema;
  }
  return SKILL_RESPONSE_SCHEMAS[skillType];
}
