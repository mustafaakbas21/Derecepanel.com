import { redirect } from "next/navigation";

import { HATA_RECETESI_ROUTES } from "@/lib/hata-recetesi/constants";

export default function HataRecetesiIndexPage() {
  redirect(HATA_RECETESI_ROUTES.havuz);
}
