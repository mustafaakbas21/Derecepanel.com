import { redirect } from "next/navigation";

import { TARAMALAR_ROUTES } from "@/lib/coach/taramalar-nav-config";

export default function TaramalarIndexPage() {
  redirect(TARAMALAR_ROUTES.analiz);
}
