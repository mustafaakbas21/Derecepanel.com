import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarRange,
  Home,
  Plus,
  Shield,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

export const ADMIN_ROUTES = {
  dashboard: "/admin",
  coaches: "/admin/koclar",
  coachNew: "/admin/koclar/yeni",
  students: "/admin/ogrenciler",
  studentNew: "/admin/ogrenciler/yeni",
  maintenance: "/admin/bakim",
  leads: "/admin/teklifler",
  globalExam: "/admin/denemeler/global",
  institutions: "/admin/kurumlar",
  accounting: "/admin/muhasebe",
  login: "/admin/giris",
} as const;

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export const adminPillNavItems = [
  { label: "Genel Bakış", href: ADMIN_ROUTES.dashboard },
  { label: "Koçlar", href: ADMIN_ROUTES.coaches },
  { label: "Öğrenciler", href: ADMIN_ROUTES.students },
  { label: "Muhasebe", href: ADMIN_ROUTES.accounting },
  { label: "Teklifler", href: ADMIN_ROUTES.leads },
  { label: "Yönetim", href: ADMIN_ROUTES.maintenance },
];

export const adminNavSections: AdminNavSection[] = [
  {
    title: "Genel",
    items: [{ label: "Genel Bakış", href: ADMIN_ROUTES.dashboard, icon: Home }],
  },
  {
    title: "Koçlar",
    items: [
      { label: "Koç Listesi", href: ADMIN_ROUTES.coaches, icon: Users },
      { label: "Yeni Koç", href: ADMIN_ROUTES.coachNew, icon: Plus },
    ],
  },
  {
    title: "Öğrenciler",
    items: [
      { label: "Öğrenci Listesi", href: ADMIN_ROUTES.students, icon: Users },
      { label: "Yeni Öğrenci", href: ADMIN_ROUTES.studentNew, icon: UserPlus },
    ],
  },
  {
    title: "Finans",
    items: [{ label: "Muhasebe", href: ADMIN_ROUTES.accounting, icon: Wallet }],
  },
  {
    title: "Yönetim",
    items: [
      { label: "Bakım Modu", href: ADMIN_ROUTES.maintenance, icon: Wrench },
      { label: "Teklif Talepleri", href: ADMIN_ROUTES.leads, icon: Shield },
    ],
  },
  {
    title: "Denemeler",
    items: [
      {
        label: "Global Deneme Takvimi",
        href: ADMIN_ROUTES.globalExam,
        icon: CalendarRange,
      },
    ],
  },
  {
    title: "Kurumlar",
    items: [{ label: "Kurumlar", href: ADMIN_ROUTES.institutions, icon: Building2 }],
  },
];

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === ADMIN_ROUTES.dashboard) return pathname === href;
  if (href === "#") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
