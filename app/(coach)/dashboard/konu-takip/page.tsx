import { redirect } from "next/navigation";

import { KONU_TAKIP_ROUTES } from "@/lib/coach/konu-takip-nav-config";

export default function KonuTakipIndexPage() {
  redirect(KONU_TAKIP_ROUTES.takip);
}
