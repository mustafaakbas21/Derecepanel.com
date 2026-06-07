/** Detaylı Konu Özeti — adım adım sihirbaz durumları */
export type OnyxSummaryStep = "IDLE" | "AWAITING_LESSON" | "AWAITING_TOPIC";

export const KONU_OZET_WIZARD_LESSON_ONYX_MESSAGE = `Sana özel, ÖSYM standartlarında hatasız bir YKS ders notu hazırlamam için sabırsızlanıyorum! 🎯

Önce hangi **Ders** üzerine çalışacağız? (Örn: Matematik, Fizik, Kimya, Biyoloji...)`;

export function konuOzetWizardTopicOnyxMessage(lesson: string): string {
  return `Harika! **${lesson}** dersini not aldım. Peki hangi **Konu** ve hangi sınav türü? (Lütfen 'TYT Fonksiyonlar' veya 'AYT Limit' şeklinde net belirt ki müfredat hatası yapmayayım).`;
}

/** Sihirbaz tamamlandığında API'ye giden nihai prompt */
export function buildKonuOzetFinalPrompt(lesson: string, topic: string): string {
  return `[ÖZEL İSTEK]: Ders: ${lesson}, Konu: ${topic}. Bu ders ve konu için bana daha önce sana öğretilen kurallara (Müfredat sınırları, LaTeX formülleri, çeldiriciler) uyarak DEVASA VE HYPER-DETAYLI bir YKS ders notu çıkar.

KESİN KURALLAR:
1. MÜFREDAT SINIRI: Türkiye MEB YKS müfredatına KESİNLİKLE uy. TYT konusunda asla Limit, Türev, İntegral, Logaritma gibi AYT konularından bahsetme!
2. BOŞ LAF YASAK: Genel tavsiye verme; ÖSYM'nin sorduğu spesifik detaylara in.
3. MATEMATİKSEL DİZGİ: Tüm formülleri LaTeX ile yaz (satır içi $, blok $$).

ÇIKTI FORMATI (Sadece bu başlıkları kullan):
# 📌 [Konu Adı] (TYT veya AYT olduğunu belirt)

### 🧠 Konunun Anatomisi
### 💎 Altın Kurallar ve Formüller
### ⚠️ ÖSYM'nin Acımasız Çeldiricileri
### 🚀 Derece Taktikleri`;
}
