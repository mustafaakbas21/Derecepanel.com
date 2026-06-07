import { KonuTakipGenelBakisPage } from "@/components/konu-takip/genel-bakis-page";

export const metadata = {
  title: "Konu Takip · Genel Bakış | DerecePanel",
  description:
    "Tüm öğrencilerin konu tamamlama oranlarını ve çözdükleri soru sayılarını tek ekranda karşılaştırın.",
};

export default function KonuTakipGenelBakisRoute() {
  return <KonuTakipGenelBakisPage />;
}
