import { redirect } from "next/navigation";

import { DENEMELER_ROUTES } from "@/lib/coach/denemeler-nav-config";

export default function DenemelerIndexPage() {
  redirect(DENEMELER_ROUTES.kurumsal);
}
