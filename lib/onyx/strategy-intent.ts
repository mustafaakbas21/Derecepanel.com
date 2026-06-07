/** Serbest metinde net / strateji niyetini algılar — structured strategy skill'e yönlendirir */

const STRATEGY_KEYS = [
  "netim",
  "netim ",
  "net ",
  " net",
  "net art",
  "net düş",
  "net dus",
  "net yüks",
  "net yuks",
  "net hedef",
  "hedef net",
  "kaç net",
  "kac net",
  "ne çalış",
  "ne calis",
  "bugün ne",
  "bugun ne",
  "haftalık program",
  "haftalik program",
  "strateji",
  "yol haritası",
  "yol haritasi",
  "net avcı",
  "net avci",
  "net roket",
  "tyt net",
  "ayt net",
  "netleri artır",
  "netleri artir",
  "deneme net",
  "toplam net",
  "günün görev",
  "gunun gorev",
  "ne yapmalıyım",
  "ne yapmaliyim",
  "nasıl artırırım",
  "nasil artiririm",
];

/** Kariyer niyeti net/strateji ile çakışmasın diye kariyer öncelikli kelimeler hariç */
const CAREER_OVERRIDE = [
  "tercih",
  "taban puan",
  "basari sirasi",
  "başarı sırası",
  "meslek",
  "kariyer danış",
  "hangi bölüm",
  "hangi bolum",
];

export function isStrategyIntentText(text: string): boolean {
  const t = text.toLocaleLowerCase("tr");
  if (!t.trim()) return false;
  if (CAREER_OVERRIDE.some((k) => t.includes(k))) return false;
  return STRATEGY_KEYS.some((k) => t.includes(k));
}
