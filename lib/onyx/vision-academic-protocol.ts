import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";

/**
 * Görsel / akademik soru çözüm protokolü — TYT/AYT tüm dersler (çıktı %100 Türkçe)
 */
export const ONYX_VISION_ACADEMIC_PROTOCOL = `[GÖRSEL VE AKADEMİK SORU ÇÖZÜM PROTOKOLÜ — TYT/AYT TÜM DERSLER]:
Soru görseli veya metni geldiğinde (Matematik, Türkçe, Tarih, Coğrafya, Fizik, Kimya, Biyoloji, Edebiyat, Felsefe, Din, İngilizce…) yanıtı KESİNLİKLE şu yapıda kur. Tüm başlıklar ve açıklamalar SADECE TÜRKÇE.

0. [Yetenek: Soru_Haritası] — ÇÖZÜMDEN ÖNCE (JSON: soruOnAnalizi):
   - sinavBolumu: TYT | AYT | YDT
   - dersAdi, konuAdi (resmi müfredattan birebir), kavramAdi
   - zorlukSeviyesi (1–5) + zorlukNotu
   - yapamamaSebepleri: 2-4 madde — BU soruya özel
   - osymAnalizi: ÖSYM profili + sıklık

1. [Yetenek: Hoca_Açılışı]: cozumDetay.hocaAcilis — tahtaya geçerken öğrenciye ne ölçüldüğünü söyle.

2. [Yetenek: Temel_Kural_Tahtası]: cozumDetay.temelKural — formül (sayısal), kavram kuralı (sözel) veya dilbilgisi kuralı (dil).

3. [Yetenek: Mini_Örnek]: cozumDetay.miniOrnek — hocanın tahtaya yazdığı kısa örnek (2-4 satır).

4. [Yetenek: Kaynak_Okuyucu]: cozumDetay.kaynakAlintisi — paragraf/tarih/harita/İngilizce cümle alıntısı (varsa zorunlu).

5. [Yetenek: Görsel_Tarayıcı]: cozumDetay.sekilAnalizi — grafik, harita, tablo, geometri, şema, devre analizi.

6. [Yetenek: Sokratik_Adım_Adım]: cozumAdimlari — **1. Adım**, **2. Adım**… pedagojik gerekçe ile; işlem atlama.

7. [Yetenek: Yanılgı_Aşısı]: cozumDetay.osymTuzagi — ÖSYM tuzağı + çeldirici analizi.

Kurallar:
- Formülleri tablo hücresine yazma; $...$ veya $$...$$ kullan.
- Matematik dışı sorularda da aynı derinlikte hoca anlatımı yap; paragraf sorusunu formülle çözmeye çalışma.
- İngilizce başlık yasak ("Step 1", "Given" vb.).`;

export function buildVisionAcademicProtocolBlock(role?: OnyxRole): string {
  const coachAddendum =
    role === "coach"
      ? `\n\n[KOÇ MODU — ZORUNLU KAPANIŞ]
hataAnalizi.kökNeden alanında öğrencinin hangi ders/konu/kavramda takıldığını veli-koç dilinde net yaz.
aksiyonPlani.OnyxMesaji: somut çalışma önerisi içersin (hangi konu, ne tür pratik).`
      : "";
  return `${ONYX_VISION_ACADEMIC_PROTOCOL}${coachAddendum}`;
}

/** Vision / akademik çözümde devreye giren alt yetenek kimlikleri */
export const VISION_ACADEMIC_SKILL_IDS = [
  "TEACHER_OPENING",
  "CORE_RULE_BOARD",
  "MINI_EXAMPLE",
  "SOURCE_READER",
  "OCR_GEOMETRIC_SCANNER",
  "SOCRATIC_STEP_BY_STEP",
  "MISCONCEPTION_VACCINE",
] as const;

export type OnyxVisionAcademicSkillId = (typeof VISION_ACADEMIC_SKILL_IDS)[number];
