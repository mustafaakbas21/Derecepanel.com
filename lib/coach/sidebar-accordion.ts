import {
  ANALIZ_MERKEZI_ROUTE,
  DENEMELER_ROUTES,
} from "@/lib/coach/denemeler-nav-config";
import { HAFTALIK_PROGRAM_ROUTES } from "@/lib/coach/haftalik-program-nav-config";
import { KONU_TAKIP_ROUTES } from "@/lib/coach/konu-takip-nav-config";
import { KUTUPHANE_ROUTES } from "@/lib/coach/kutuphane-nav-config";
import { YKS_SIM_ROUTES } from "@/lib/coach/yks-sim-nav-config";
import { HATA_RECETESI_ROUTES } from "@/lib/hata-recetesi/constants";
import { TARAMALAR_ROUTES } from "@/lib/coach/taramalar-nav-config";
import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";

/** Sidebar accordion grup kimlikleri */
export type CoachNavGroupId = "dn" | "kutup" | "kt" | "wp" | "yks" | "hr" | "tm" | "tr";

export function coachNavGroupFromPath(pathname: string): CoachNavGroupId | null {
  if (
    pathname === DENEMELER_ROUTES.root ||
    pathname.startsWith(`${DENEMELER_ROUTES.root}/`) ||
    pathname === ANALIZ_MERKEZI_ROUTE ||
    pathname.startsWith(`${ANALIZ_MERKEZI_ROUTE}/`)
  ) {
    return "dn";
  }
  if (
    pathname === KUTUPHANE_ROUTES.root ||
    pathname.startsWith(`${KUTUPHANE_ROUTES.root}/`)
  ) {
    return "kutup";
  }
  if (
    pathname === KONU_TAKIP_ROUTES.root ||
    pathname.startsWith(`${KONU_TAKIP_ROUTES.root}/`)
  ) {
    return "kt";
  }
  if (
    pathname === HAFTALIK_PROGRAM_ROUTES.root ||
    pathname.startsWith(`${HAFTALIK_PROGRAM_ROUTES.root}/`) ||
    pathname === HAFTALIK_PROGRAM_ROUTES.olusturucu ||
    pathname.startsWith(`${HAFTALIK_PROGRAM_ROUTES.olusturucu}/`)
  ) {
    return "wp";
  }
  if (
    pathname === YKS_SIM_ROUTES.root ||
    pathname.startsWith(`${YKS_SIM_ROUTES.root}/`)
  ) {
    return "yks";
  }
  if (
    pathname === HATA_RECETESI_ROUTES.root ||
    pathname.startsWith(`${HATA_RECETESI_ROUTES.root}/`)
  ) {
    return "hr";
  }
  if (
    pathname === TEST_MAKER_ROUTES.root ||
    pathname.startsWith(`${TEST_MAKER_ROUTES.root}/`)
  ) {
    return "tm";
  }
  if (
    pathname === TARAMALAR_ROUTES.root ||
    pathname.startsWith(`${TARAMALAR_ROUTES.root}/`)
  ) {
    return "tr";
  }
  return null;
}
