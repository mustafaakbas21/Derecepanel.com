import type { ClassField } from "@/lib/classes/types";
import { FIELD_BADGE, FIELD_LABELS } from "@/lib/students/constants";

export const CLASSES_STORAGE_KEY = "institution_classes_v1";

/** Modal ve filtrelerde kullanılan detaylı YKS alan kartları */
export type YksClassFieldOption = {
  value: ClassField;
  label: string;
  code: string;
  examTrack: string;
  description: string;
};

export const YKS_CLASS_FIELD_OPTIONS: YksClassFieldOption[] = [
  {
    value: "tyt",
    label: "TYT",
    code: "TYT",
    examTrack: "Temel Yeterlilik",
    description:
      "Sadece TYT hazırlığı; henüz AYT puan türü seçmemiş veya temel seviye gruplar.",
  },
  {
    value: "sayisal",
    label: "Sayısal",
    code: "MF",
    examTrack: "Matematik–Fen",
    description:
      "AYT sayısal (MF); matematik, fizik, kimya, biyoloji ağırlıklı hedef programlar.",
  },
  {
    value: "esit",
    label: "Eşit Ağırlık",
    code: "TM",
    examTrack: "Türkçe–Matematik",
    description:
      "AYT eşit ağırlık (TM); tıp, hukuk, mimarlık, işletme vb. dengeli programlar.",
  },
  {
    value: "sozel",
    label: "Sözel",
    code: "TS",
    examTrack: "Türkçe–Sosyal",
    description:
      "AYT sözel (TS); edebiyat, tarih, coğrafya, felsefe, psikoloji vb. programlar.",
  },
  {
    value: "dil",
    label: "Dil",
    code: "DİL",
    examTrack: "Yabancı Dil",
    description:
      "AYT dil (YDT); İngilizce öğretmenliği, mütercim, çeviri, yabancı dil bölümleri.",
  },
];

export const CLASS_FIELD_OPTIONS = YKS_CLASS_FIELD_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export const CLASS_FIELD_LABEL: Record<ClassField, string> = FIELD_LABELS;

export type ClassFieldFilterId = "tumu" | ClassField;

export const CLASS_ALAN_TABS: { id: ClassFieldFilterId; label: string }[] = [
  { id: "tumu", label: "Tümü" },
  { id: "tyt", label: "TYT" },
  { id: "sayisal", label: "Sayısal" },
  { id: "esit", label: "Eşit ağırlık" },
  { id: "sozel", label: "Sözel" },
  { id: "dil", label: "Dil" },
];

/** Öğrencilerim tablosu ile aynı rozet stili */
export const CLASS_FIELD_BADGE: Record<ClassField, string> = FIELD_BADGE;

export function classFieldCode(field: ClassField): string {
  return YKS_CLASS_FIELD_OPTIONS.find((o) => o.value === field)?.code ?? field.toUpperCase();
}
