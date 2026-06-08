"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  Home,
  Layers,
  Library,
  ListChecks,
  LogOut,
  MessageSquare,
  Pill,
  Sparkles,
  Target,
} from "lucide-react";

import { CoachNavGroup } from "@/components/coach/coach-nav-group";
import { SidebarUpgradeCta } from "@/components/marketing/pricing/sidebar-upgrade-cta";
import {
  isStudentSubLinkActive,
  isStudentTopLinkActive,
} from "@/lib/student/sidebar-nav-active";
import {
  studentDenemelerNavGroup,
  studentHaftalikProgramNavGroup,
  studentHataRecetesiNavGroup,
  studentKitapNavGroup,
  studentKonuTakipNavGroup,
  studentTaramalarNavGroup,
  studentTopNavItems,
  studentYksSimNavGroup,
  STUDENT_HAFTALIK_PROGRAM_ROUTES,
  STUDENT_HATA_RECETESI_ROUTES,
  STUDENT_KITAP_ROUTES,
  STUDENT_KONU_TAKIP_ROUTES,
  STUDENT_TARAMA_ROUTES,
  STUDENT_YKS_SIM_ROUTES,
} from "@/lib/student/sidebar-nav-config";
import {
  studentNavGroupFromPath,
  type StudentNavGroupId,
} from "@/lib/student/sidebar-accordion";
import { cn } from "@/lib/utils";

import "@/styles/coach-sidebar.css";

const iconMap = {
  home: Home,
  sparkles: Sparkles,
  calendar: CalendarDays,
  target: Target,
  message: MessageSquare,
} as const;

const groupIconMap = {
  listChecks: ListChecks,
  library: Library,
  clipboardList: ClipboardList,
  graduationCap: GraduationCap,
  pill: Pill,
  layers: Layers,
} as const;

type SubNavItem = { label: string; href: string; beta?: boolean };

function collectSubHrefs(children: readonly SubNavItem[]): string[] {
  return children.map((c) => c.href);
}

export function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sectionActive = studentNavGroupFromPath(pathname);

  const [openGroup, setOpenGroup] = useState<StudentNavGroupId | null>(() =>
    studentNavGroupFromPath(pathname)
  );

  useEffect(() => {
    setOpenGroup(studentNavGroupFromPath(pathname));
  }, [pathname]);

  const toggleGroup = useCallback((id: string) => {
    setOpenGroup((prev) => (prev === id ? null : (id as StudentNavGroupId)));
  }, []);

  const handleLogout = () => {
    router.push("/");
  };

  const renderSubLinks = (
    children: readonly SubNavItem[],
    opts?: { moduleRoot?: string; defaultChildHref?: string }
  ) => {
    const siblingHrefs = collectSubHrefs(children);
    return children.map((sub) => {
      const active = isStudentSubLinkActive(pathname, sub.href, {
        siblingHrefs,
        moduleRoot: opts?.moduleRoot,
        defaultChildHref: opts?.defaultChildHref,
      });
      return (
        <Link
          key={sub.href}
          href={sub.href}
          className={cn("coach-nav-sub-link", active && "coach-nav-sub-link--active")}
          aria-current={active ? "page" : undefined}
        >
          {sub.label}
          {sub.beta ? (
            <span className="ml-auto rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
              Beta
            </span>
          ) : null}
        </Link>
      );
    });
  };

  return (
    <aside className="sidebar-panel flex min-h-0 flex-1 flex-col overflow-clip px-4 pb-5 pt-5">
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {studentTopNavItems.map((item) => {
          const Icon = iconMap[item.icon];
          const active = isStudentTopLinkActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn("coach-nav-top-link", active && "coach-nav-top-link--active")}
            >
              <Icon
                className="coach-nav-top-link__icon"
                strokeWidth={active ? 2.25 : 2}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <CoachNavGroup
          id="wp"
          label={studentHaftalikProgramNavGroup.label}
          icon={CalendarRange}
          open={openGroup === "wp"}
          sectionActive={sectionActive === "wp"}
          onToggle={toggleGroup}
          subId="nav-student-wp-sub"
          subLabel="Haftalık Program alt menü"
        >
          {renderSubLinks(studentHaftalikProgramNavGroup.children, {
            moduleRoot: STUDENT_HAFTALIK_PROGRAM_ROUTES.root,
            defaultChildHref: STUDENT_HAFTALIK_PROGRAM_ROUTES.buHafta,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="kt"
          label={studentKonuTakipNavGroup.label}
          icon={groupIconMap[studentKonuTakipNavGroup.icon]}
          open={openGroup === "kt"}
          sectionActive={sectionActive === "kt"}
          onToggle={toggleGroup}
          subId="nav-student-kt-sub"
          subLabel="Konu Takibi alt menü"
        >
          {renderSubLinks(studentKonuTakipNavGroup.children, {
            moduleRoot: STUDENT_KONU_TAKIP_ROUTES.root,
            defaultChildHref: STUDENT_KONU_TAKIP_ROUTES.durum,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="lib"
          label={studentKitapNavGroup.label}
          icon={groupIconMap[studentKitapNavGroup.icon]}
          open={openGroup === "lib"}
          sectionActive={sectionActive === "lib"}
          onToggle={toggleGroup}
          subId="nav-student-lib-sub"
          subLabel="Kitaplarım alt menü"
        >
          {renderSubLinks(studentKitapNavGroup.children, {
            moduleRoot: STUDENT_KITAP_ROUTES.root,
            defaultChildHref: STUDENT_KITAP_ROUTES.atanan,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="dn"
          label={studentDenemelerNavGroup.label}
          icon={groupIconMap[studentDenemelerNavGroup.icon]}
          open={openGroup === "dn"}
          sectionActive={sectionActive === "dn"}
          onToggle={toggleGroup}
          subId="nav-student-dn-sub"
          subLabel="Denemeler alt menü"
        >
          {renderSubLinks(studentDenemelerNavGroup.children)}
        </CoachNavGroup>

        <CoachNavGroup
          id="yks"
          label={studentYksSimNavGroup.label}
          icon={groupIconMap[studentYksSimNavGroup.icon]}
          open={openGroup === "yks"}
          sectionActive={sectionActive === "yks"}
          onToggle={toggleGroup}
          subId="nav-student-yks-sub"
          subLabel="YKS Simülasyon alt menü"
        >
          {renderSubLinks(studentYksSimNavGroup.children, {
            moduleRoot: STUDENT_YKS_SIM_ROUTES.root,
            defaultChildHref: STUDENT_YKS_SIM_ROUTES.tercih,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="hr"
          label={studentHataRecetesiNavGroup.label}
          icon={groupIconMap[studentHataRecetesiNavGroup.icon]}
          open={openGroup === "hr"}
          sectionActive={sectionActive === "hr"}
          onToggle={toggleGroup}
          subId="nav-student-hr-sub"
          subLabel="Hata Reçetesi alt menü"
        >
          {renderSubLinks(studentHataRecetesiNavGroup.children, {
            moduleRoot: STUDENT_HATA_RECETESI_ROUTES.root,
            defaultChildHref: STUDENT_HATA_RECETESI_ROUTES.verilen,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="tr"
          label={studentTaramalarNavGroup.label}
          icon={groupIconMap[studentTaramalarNavGroup.icon]}
          open={openGroup === "tr"}
          sectionActive={sectionActive === "tr"}
          onToggle={toggleGroup}
          subId="nav-student-tr-sub"
          subLabel="Taramalar ve Fasiküller alt menü"
        >
          {renderSubLinks(studentTaramalarNavGroup.children)}
        </CoachNavGroup>
      </nav>

      <div className="mt-4 shrink-0 space-y-3 border-t border-slate-200/70 pt-4">
        <SidebarUpgradeCta
          audience="ogrenci"
          title="Paketini Yükselt"
          subtitle="Dijital Plus ile analiz araçları ve Onyx desteği."
          buttonLabel="Paketleri Gör"
        />

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-3 text-[15px] font-semibold text-slate-800 transition-all hover:border-red-200/80 hover:bg-white hover:text-red-600"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-red-50 group-hover:text-red-600">
            <LogOut className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
          </span>
          <span>Çıkış</span>
        </button>
      </div>
    </aside>
  );
}
