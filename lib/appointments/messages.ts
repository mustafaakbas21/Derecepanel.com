import { WA_TEST_NUMBER } from "@/lib/appointments/constants";
import { buildWhatsAppUrl, formatTrShortDate } from "@/lib/appointments/utils";

export function formPreviewWhatsAppMessage(
  ogrenci: string,
  tarihIso: string,
  saat: string
) {
  const tarihHuman = formatTrShortDate(tarihIso);
  return `Merhaba ${ogrenci}, ${tarihHuman} günü saat ${saat}'te görüşme randevunuz oluşturulmuştur. İyi çalışmalar dileriz.`;
}

export function cardWhatsAppMessage(ogrenci: string, tarihIso: string, saat: string) {
  const tarihHuman = formatTrShortDate(tarihIso);
  return `Merhaba ${ogrenci}, ${tarihHuman} günü saat ${saat || "—"}'teki görüşme randevunuz için yazıyorum. İyi çalışmalar dilerim.`;
}

export function formPreviewWhatsAppUrl(ogrenci: string, tarihIso: string, saat: string) {
  return buildWhatsAppUrl(
    WA_TEST_NUMBER,
    formPreviewWhatsAppMessage(ogrenci, tarihIso, saat)
  );
}
