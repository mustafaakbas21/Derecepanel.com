import type { TemplateId } from "@/lib/test-maker/types";

export type TemplateGroup = "primary" | "other";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  subtitle: string;
  group: TemplateGroup;
  preview: { headerColor: string };
  tokens?: {
    hdrBg?: string;
    accent?: string;
  };
}

/** Tek kaynak — şablon kataloğu (10 adet, sıra sabit) */
export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: "derece",
    name: "Derece Kurumsal",
    subtitle: "Serif · Çift çizgi · Klasik",
    group: "primary",
    preview: { headerColor: "#0d47a1" },
    tokens: { hdrBg: "#0d47a1", accent: "#1565c0" },
  },
  {
    id: "uc-boyutlu",
    name: "Üç Boyutlu Vizyon",
    subtitle: "Kalın çizgi · Siyah rozet",
    group: "primary",
    preview: { headerColor: "#1e293b" },
    tokens: { hdrBg: "transparent", accent: "#0f172a" },
  },
  {
    id: "sarmal",
    name: "Sarmal Dinamik",
    subtitle: "Kesik çizgi · Turuncu rozet",
    group: "primary",
    preview: { headerColor: "#e65100" },
    tokens: { hdrBg: "#e65100", accent: "#f57c00" },
  },
  {
    id: "yeni-nesil",
    name: "Yeni Nesil 3-4-5",
    subtitle: "Minimal · İnce · Modern",
    group: "primary",
    preview: { headerColor: "#374151" },
    tokens: { hdrBg: "#fafafa", accent: "#374151" },
  },
  {
    id: "limitless",
    name: "Limitless Format",
    subtitle: "Siyah · Geniş aralık",
    group: "other",
    preview: { headerColor: "#212121" },
    tokens: { hdrBg: "#212121", accent: "#424242" },
  },
  {
    id: "hiz-renk",
    name: "Hız ve Renk Tarzı",
    subtitle: "Kırmızı · Dinamik",
    group: "other",
    preview: { headerColor: "#c62828" },
    tokens: { hdrBg: "#c62828", accent: "#e53935" },
  },
  {
    id: "orijinal-mat",
    name: "Orijinal Mat",
    subtitle: "Koyu gri · Sade",
    group: "other",
    preview: { headerColor: "#37474f" },
    tokens: { hdrBg: "#37474f", accent: "#546e7a" },
  },
  {
    id: "karekök",
    name: "Karekök Klasik",
    subtitle: "Yeşil · Serif başlık",
    group: "other",
    preview: { headerColor: "#2e7d32" },
    tokens: { hdrBg: "#2e7d32", accent: "#388e3c" },
  },
  {
    id: "aydinlik",
    name: "Aydınlık Sayfalar",
    subtitle: "Açık · Ferah · Mavi",
    group: "other",
    preview: { headerColor: "#e3f2fd" },
    tokens: { hdrBg: "#e3f2fd", accent: "#1565c0" },
  },
  {
    id: "paraf",
    name: "Paraf Özel",
    subtitle: "Mor · Serif başlık",
    group: "other",
    preview: { headerColor: "#4a148c" },
    tokens: { hdrBg: "#4a148c", accent: "#6a1b9a" },
  },
];

const BY_ID = new Map<TemplateId, TemplateDefinition>(
  TEMPLATE_REGISTRY.map((t) => [t.id, t])
);

const ALL_IDS = new Set<TemplateId>(TEMPLATE_REGISTRY.map((t) => t.id));

export const DEFAULT_TEMPLATE_ID: TemplateId = "derece";

export const DEFAULT_TEMPLATE = getTemplateById(DEFAULT_TEMPLATE_ID);

export function isTemplateId(value: string): value is TemplateId {
  return ALL_IDS.has(value as TemplateId);
}

export function getTemplateById(id: TemplateId): TemplateDefinition {
  return BY_ID.get(id) ?? BY_ID.get(DEFAULT_TEMPLATE_ID)!;
}

export function getTemplateName(id: TemplateId): string {
  return getTemplateById(id).name;
}

/** Arşiv / fascicle — bilinmeyen veya boş → derece */
export function resolveTemplateId(raw: string | null | undefined): TemplateId {
  if (raw && isTemplateId(raw)) return raw;
  return DEFAULT_TEMPLATE_ID;
}

export function getTemplatesByGroup(group: TemplateGroup): TemplateDefinition[] {
  return TEMPLATE_REGISTRY.filter((t) => t.group === group);
}
