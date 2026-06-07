import { redirect } from "next/navigation";

import { KUTUPHANE_ROUTES } from "@/lib/coach/kutuphane-nav-config";

export default function KutuphaneIndexPage() {
  redirect(KUTUPHANE_ROUTES.kitaplar);
}
