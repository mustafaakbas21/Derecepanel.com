import { KonuTakipPage } from "@/components/konu-takip/konu-takip-page";

export const metadata = {
  title: "Konu Takibi | DerecePanel",
  description:
    "Öğrenci bazında YKS müfredatındaki konu ilerlemesini, çözülen soruları ve kullanılan kaynakları takip edin.",
};

export default function KonuTakipRoute() {
  return <KonuTakipPage />;
}
