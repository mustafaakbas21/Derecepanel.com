import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  Target,
  TrendingUp,
} from "lucide-react";

import type { OnyxActionType } from "@/lib/onyx/types";

export type OnyxQuickPrompt = {
  id: OnyxActionType;
  label: string;
  /** Kullanıcıya chat'te görünen / API'ye giden metin */
  promptText: string;
  icon: LucideIcon;
};

export const ONYX_QUICK_PROMPTS: OnyxQuickPrompt[] = [
  {
    id: "konu-ozet",
    label: "Detaylı Konu Özeti",
    promptText: `Öğrencinin güncel verilerinde en çok hata yaptığı 1 YKS konusunu seç ve bana bu konu için 'Derece Öğrencisi Seviyesinde Premium Bir Fasikül Özeti' çıkar.

KESİN KURALLAR:
1. MÜFREDAT SINIRI: Türkiye MEB YKS müfredatına KESİNLİKLE uyacaksın. TYT konusunda asla Limit, Türev, İntegral, Logaritma gibi AYT konularından bahsetme!
2. BOŞ LAF YASAK: 'Fonksiyonlar toplanabilir', 'Bol soru çözün' gibi ilkokul seviyesi tavsiyeler verme. ÖSYM'nin sorduğu spesifik detaylara in.
3. MATEMATİKSEL DİZGİ: Tüm formülleri KESİNLİKLE LaTeX formatında yaz. Satır içi için tek $, bağımsız denklemler için çift $$ kullan. (Örn: $f(x) = ax+b$)

ÇIKTI FORMATI (Sadece bu başlıkları kullan):
# 📌 [Konu Adı] (TYT veya AYT olduğunu belirt)

### 🧠 Konunun Anatomisi
(Bu konu YKS'de ne anlama geliyor? Hangi konularla bağlantılı? 2 cümlelik derin analitik özet.)

### 💎 Altın Kurallar ve Formüller
(Konunun en hayati 3-4 kuralını ver. Sözel anlatma, doğrudan LaTeX ile formülünü yazıp ne işe yaradığını açıkla. Örn: Bileşke fonksiyon $(f \\circ g)(x) = f(g(x))$ vb.)

### ⚠️ ÖSYM'nin Acımasız Çeldiricileri
(ÖSYM bu konuda öğrenciyi hangi kavram yanılgısıyla avlar? Madde madde, çok spesifik örnekler ver. Örn: 'Görüntü kümesi ile Değer kümesini karıştırma tuzağı')

### 🚀 Derece Taktikleri
(Soru çözerken zaman kazandıracak, pratik bir yöntem veya algoritma ver.)`,
    icon: ClipboardList,
  },
  {
    id: "deneme-trend",
    label: "Deneme Trend Analizi",
    promptText: `Öğrencinin son 5 deneme verisine göre trend analizi yap: net kırılma noktaları, ders dengesi ve en kritik zayıf konular. Genel geçer SWOT cümleleri kurma; somut sayı ve konu adı kullan.`,
    icon: TrendingUp,
  },
  {
    id: "haftalik-program",
    label: "Haftalık Program Yaz",
    promptText: `Öğrencinin güncel eksiklerine ve hedefine bakarak ona stratejik bir haftalık YKS programı hazırla. Bu programı KESİNLİKLE düz metin olarak DEĞİL, bir Markdown Tablosu olarak oluştur. Tablo şu sütunlardan oluşsun: | Gün | Sabah (Odak) | Öğle (Pratik) | Akşam (Tekrar) | . Tablonun altına da koç olarak 1 paragraflık bir motivasyon notu düş.`,
    icon: CalendarDays,
  },
  {
    id: "net-avcisi",
    label: "Net Avcısı (Taktik)",
    promptText: `Öğrencinin netlerine ve hedefine bak. En az eforla, en hızlı net kazanabileceği 3 spesifik konuyu tespit et (Net Avcısı Stratejisi). Çıktıyı şu formatta ver:
1. 🎯 [Konu Adı] (+X Net Beklentisi)
   - Neden Seçildi: (Örn: Geçmişte iyiydin ama unuttun)
   - Çalışma Eforu: (Düşük/Orta/Yüksek)
   - Aksiyon: (Hangi kitaptan kaç soru çözülmeli?)`,
    icon: Target,
  },
];
