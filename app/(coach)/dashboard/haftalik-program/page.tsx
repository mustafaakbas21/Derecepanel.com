import { redirect } from "next/navigation";

import { HAFTALIK_PROGRAM_ROUTES } from "@/lib/coach/haftalik-program-nav-config";

export default function HaftalikProgramIndexPage() {
  redirect(HAFTALIK_PROGRAM_ROUTES.olusturucu);
}
