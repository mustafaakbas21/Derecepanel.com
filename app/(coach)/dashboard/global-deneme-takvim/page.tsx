import { redirect } from "next/navigation";

import { DENEMELER_ROUTES } from "@/lib/coach/denemeler-nav-config";

/** Eski URL → yeni global takvim rotası */
export default function GlobalDenemeTakvimRedirect() {
  redirect(DENEMELER_ROUTES.globalTakvim);
}
