import {
  isCoachSubLinkActive,
  isCoachTopLinkActive,
} from "@/lib/coach/sidebar-nav-active";

export { isCoachSubLinkActive as isStudentSubLinkActive };

export function isStudentTopLinkActive(pathname: string, href: string): boolean {
  if (href === "/ogrenci") return pathname === "/ogrenci";
  return isCoachTopLinkActive(pathname, href);
}
