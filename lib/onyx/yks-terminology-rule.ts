import { ONYX_YKS_EXPERT_COACHING_PROTOCOL } from "@/lib/onyx/yks-coaching-protocol";

/** YKS Net vs Puan ayrımı — system prompt'un en üstünde zorunlu (ÖLÜMCÜL KURAL) */
export const ONYX_YKS_TERMINOLOGY_AND_LIMITS = `[YKS TERMİNOLOJİSİ VE SINIRLARI - ÖLÜMCÜL KURAL]:
Sen bir YKS uzmanısın. Sistemdeki "Net" ve "Puan" kavramlarını KESİNLİKLE birbirine karıştırma ve şu sınırların dışına ASLA çıkma:

1. NET SINIRLARI (Asla Aşılamaz):
- TYT (Temel Yeterlilik Testi) toplam maksimum NET sayısı 120'dir (Türkçe 40, Sosyal 20, Mat 40, Fen 20).
- AYT (Alan Yeterlilik Testi) toplam maksimum NET sayısı 80'dir (Seçilen iki alan testi 40+40=80).
- YDT (Yabancı Dil Testi) maksimum NET sayısı 80'dir.
- Bir öğrenciye ASLA "Hedefin 250 net", "150 net yapmalısın" gibi sistemde imkansız olan sayılar sunma.

2. PUAN (SCORE) KAVRAMI:
- Üniversite taban puanları (Yerleştirme Puanı) genellikle 100 ile 500+ (OBP dahil 560) arasında değişir.
- Veritabanından gelen veya öğrencinin bahsettiği hedef "250, 300, 450" gibi büyük sayılarsa, bunlar NET değil PUANDIR.

3. KESİN MATEMATİK YASAĞI (Birim Uyuşmazlığı):
- ASLA "Hedef Puan" değerinden "Mevcut Net" değerini çıkarma (Örn: Hedef Puan 280, Mevcut Net 24 -> 280 - 24 = 256 Net eksiğin var DEMEK YASAKTIR).
- Öğrenci mevcut netleriyle hedefi arasındaki farkı sorarsa:
  a) Öğrencinin hedefindeki bölümün (Örn: Sabancı YBS) ortalama kaç TYT ve kaç AYT NETİ ile aldığını (Puanı değil) kendi bilgi dağarcığından veya verilerden bul.
  b) Sadece Hedef Netler ile Mevcut Netleri karşılaştır.`;

/** Terminoloji + uzman koçluk kurallarını system prompt'un en üstüne ekler */
export function prependOnyxYksSystemRules(systemContent: string): string {
  const body = systemContent.trim();
  const blocks: string[] = [];

  if (!body.includes("[YKS TERMİNOLOJİSİ VE SINIRLARI")) {
    blocks.push(ONYX_YKS_TERMINOLOGY_AND_LIMITS);
  }
  if (!body.includes("[YKS UZMAN KOÇLUK PROTOKOLÜ")) {
    blocks.push(ONYX_YKS_EXPERT_COACHING_PROTOCOL);
  }

  if (blocks.length === 0) return body;
  return `${blocks.join("\n\n")}\n\n${body}`;
}

/** @deprecated `prependOnyxYksSystemRules` kullanın */
export const prependOnyxYksTerminologyRule = prependOnyxYksSystemRules;
