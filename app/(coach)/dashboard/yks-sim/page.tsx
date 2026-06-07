import { redirect } from "next/navigation";

import { YKS_SIM_ROUTES } from "@/lib/coach/yks-sim-nav-config";

export default function YksSimIndex() {
  redirect(YKS_SIM_ROUTES.tercih);
}
