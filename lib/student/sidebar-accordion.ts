import {
  STUDENT_DENEME_ROUTES,
  STUDENT_HAFTALIK_PROGRAM_ROUTES,
  STUDENT_HATA_RECETESI_ROUTES,
  STUDENT_KITAP_ROUTES,
  STUDENT_KONU_TAKIP_ROUTES,
  STUDENT_TARAMA_ROUTES,
  STUDENT_YKS_SIM_ROUTES,
} from "@/lib/student/sidebar-nav-config";

export type StudentNavGroupId = "wp" | "kt" | "lib" | "dn" | "yks" | "hr" | "tr";

function matchesRoot(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

export function studentNavGroupFromPath(pathname: string): StudentNavGroupId | null {
  if (
    matchesRoot(pathname, STUDENT_HAFTALIK_PROGRAM_ROUTES.root)
  ) {
    return "wp";
  }
  if (matchesRoot(pathname, STUDENT_KONU_TAKIP_ROUTES.root)) {
    return "kt";
  }
  if (matchesRoot(pathname, STUDENT_KITAP_ROUTES.root)) {
    return "lib";
  }
  if (
    matchesRoot(pathname, STUDENT_DENEME_ROUTES.kurumsal) ||
    matchesRoot(pathname, STUDENT_DENEME_ROUTES.global) ||
    matchesRoot(pathname, STUDENT_DENEME_ROUTES.sonuclar) ||
    matchesRoot(pathname, STUDENT_DENEME_ROUTES.analiz)
  ) {
    return "dn";
  }
  if (
    pathname.startsWith("/ogrenci/yks-sim")
  ) {
    return "yks";
  }
  if (matchesRoot(pathname, STUDENT_HATA_RECETESI_ROUTES.root)) {
    return "hr";
  }
  if (
    matchesRoot(pathname, STUDENT_TARAMA_ROUTES.taramalar) ||
    matchesRoot(pathname, STUDENT_TARAMA_ROUTES.fasikuller)
  ) {
    return "tr";
  }
  return null;
}
