"use client";

import { GuardedCoachLink } from "@/components/coach/guarded-coach-link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  Layers,
  Library,
  ListChecks,
  LogOut,
  Pill,
  Sparkles,
  Users,
} from "lucide-react";

import { NavAnalizBetaLink } from "@/components/analiz-merkezi/NavAnalizBetaLink";
import { NavPazarlamaBetaLink } from "@/components/pazarlama/NavPazarlamaBetaLink";
import "@/components/analiz-merkezi/nav-analiz-beta.css";
import { CoachNavGroup } from "@/components/coach/coach-nav-group";
import { SidebarUpgradeCta } from "@/components/marketing/pricing/sidebar-upgrade-cta";
import { navItems } from "@/lib/coach/dummy-data";
import { denemelerNavGroup, DENEMELER_ROUTES } from "@/lib/coach/denemeler-nav-config";
import { hataRecetesiNavGroup } from "@/lib/coach/hata-recetesi-nav-config";
import { HATA_RECETESI_ROUTES } from "@/lib/hata-recetesi/constants";
import {
  haftalikProgramNavGroup,
  HAFTALIK_PROGRAM_ROUTES,
} from "@/lib/coach/haftalik-program-nav-config";
import { konuTakipNavGroup, KONU_TAKIP_ROUTES } from "@/lib/coach/konu-takip-nav-config";
import { kutuphaneNavGroup, KUTUPHANE_ROUTES } from "@/lib/coach/kutuphane-nav-config";
import { testMakerNavGroup } from "@/lib/coach/nav-config";
import { taramalarNavGroup, TARAMALAR_ROUTES } from "@/lib/coach/taramalar-nav-config";
import {
  coachNavGroupFromPath,
  type CoachNavGroupId,
} from "@/lib/coach/sidebar-accordion";
import {
  isCoachSubLinkActive,
  isCoachTopLinkActive,
} from "@/lib/coach/sidebar-nav-active";
import { ONYX_ROUTE } from "@/lib/coach/onyx-nav-config";
import { PAZARLAMA_ROUTE } from "@/lib/coach/pazarlama-nav-config";
import { yksSimNavGroup, YKS_SIM_ROUTES } from "@/lib/coach/yks-sim-nav-config";
import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";
import { coachTryNavigate } from "@/lib/coach/guarded-nav";
import { cn } from "@/lib/utils";

import "@/styles/coach-sidebar.css";

const iconMap = {
  home: Home,
  users: Users,
  classes: GraduationCap,
  calendar: CalendarDays,
} as const;

type SubNavItem = { label: string; href: string; beta?: boolean };

function collectSubHrefs(children: readonly SubNavItem[]): string[] {
  return children.map((c) => c.href);
}

export function CoachSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sectionActive = coachNavGroupFromPath(pathname);

  const [openGroup, setOpenGroup] = useState<CoachNavGroupId | null>(() =>
    coachNavGroupFromPath(pathname)
  );

  useEffect(() => {
    // Rota değişince: grup sayfasındaysak o grubu aç, değilsek (ör. Ana Sayfa) hepsini kapat
    setOpenGroup(coachNavGroupFromPath(pathname));
  }, [pathname]);

  const toggleGroup = useCallback((id: string) => {
    setOpenGroup((prev) => (prev === id ? null : (id as CoachNavGroupId)));
  }, []);

  const handleLogout = () => {
    if (!coachTryNavigate("/", pathname)) return;
    router.push("/");
  };

  const renderSubLinks = (
    children: readonly SubNavItem[],
    opts?: { moduleRoot?: string; defaultChildHref?: string }
  ) => {
    const siblingHrefs = collectSubHrefs(children);
    return children.map((sub) => {
      const active = isCoachSubLinkActive(pathname, sub.href, {
        siblingHrefs,
        moduleRoot: opts?.moduleRoot,
        defaultChildHref: opts?.defaultChildHref,
      });
      if (sub.beta) {
        return <NavAnalizBetaLink key={sub.href} active={active} />;
      }
      return (
        <GuardedCoachLink
          key={sub.href}
          href={sub.href}
          className={cn("coach-nav-sub-link", active && "coach-nav-sub-link--active")}
          aria-current={active ? "page" : undefined}
        >
          {sub.label}
        </GuardedCoachLink>
      );
    });
  };

  return (
    <aside className="sidebar-panel flex min-h-0 flex-1 flex-col overflow-clip px-4 pb-5 pt-5">
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {navItems.menu.map((item) => {
          const Icon = iconMap[item.icon];
          const active = isCoachTopLinkActive(pathname, item.href);
          return (
            <GuardedCoachLink
              key={item.label}
              href={item.href}
              className={cn("coach-nav-top-link", active && "coach-nav-top-link--active")}
            >
              <Icon
                className="coach-nav-top-link__icon"
                strokeWidth={active ? 2.25 : 2}
              />
              <span>{item.label}</span>
            </GuardedCoachLink>
          );
        })}

        <NavPazarlamaBetaLink active={pathname === PAZARLAMA_ROUTE || pathname.startsWith(`${PAZARLAMA_ROUTE}/`)} />

        <GuardedCoachLink
          href={ONYX_ROUTE}
          className={cn(
            "coach-nav-top-link",
            isCoachTopLinkActive(pathname, ONYX_ROUTE) && "coach-nav-top-link--active"
          )}
        >
          <Sparkles
            className="coach-nav-top-link__icon text-amber-600"
            strokeWidth={pathname === ONYX_ROUTE || pathname.startsWith(`${ONYX_ROUTE}/`) ? 2.25 : 2}
          />
          <span>Onyx AI</span>
        </GuardedCoachLink>

        <CoachNavGroup
          id="kutup"
          label={kutuphaneNavGroup.label}
          icon={Library}
          open={openGroup === "kutup"}
          sectionActive={sectionActive === "kutup"}
          onToggle={toggleGroup}
          subId="nav-kutup-sub"
          subLabel="Kitap Kütüphanesi alt menü"
        >
          {renderSubLinks(kutuphaneNavGroup.children, {
            moduleRoot: KUTUPHANE_ROUTES.root,
            defaultChildHref: KUTUPHANE_ROUTES.kitaplar,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="kt"
          label={konuTakipNavGroup.label}
          icon={ListChecks}
          open={openGroup === "kt"}
          sectionActive={sectionActive === "kt"}
          onToggle={toggleGroup}
          subId="nav-kt-sub"
          subLabel="Konu Takip Merkezi alt menü"
        >
          {renderSubLinks(konuTakipNavGroup.children, {
            moduleRoot: KONU_TAKIP_ROUTES.root,
            defaultChildHref: KONU_TAKIP_ROUTES.takip,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="wp"
          label={haftalikProgramNavGroup.label}
          icon={CalendarRange}
          open={openGroup === "wp"}
          sectionActive={sectionActive === "wp"}
          onToggle={toggleGroup}
          subId="nav-wp-sub"
          subLabel="Haftalık Program alt menü"
        >
          {renderSubLinks(haftalikProgramNavGroup.children, {
            moduleRoot: HAFTALIK_PROGRAM_ROUTES.root,
            defaultChildHref: HAFTALIK_PROGRAM_ROUTES.olusturucu,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="dn"
          label={denemelerNavGroup.label}
          icon={ClipboardList}
          open={openGroup === "dn"}
          sectionActive={sectionActive === "dn"}
          onToggle={toggleGroup}
          subId="nav-dn-sub"
          subLabel="Denemeler alt menü"
        >
          {renderSubLinks(denemelerNavGroup.children, {
            moduleRoot: DENEMELER_ROUTES.root,
            defaultChildHref: DENEMELER_ROUTES.kurumsal,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="yks"
          label={yksSimNavGroup.label}
          icon={GraduationCap}
          open={openGroup === "yks"}
          sectionActive={sectionActive === "yks"}
          onToggle={toggleGroup}
          subId="nav-yks-sub"
          subLabel="YKS Simülasyon alt menü"
        >
          {renderSubLinks(yksSimNavGroup.children, {
            moduleRoot: YKS_SIM_ROUTES.root,
            defaultChildHref: YKS_SIM_ROUTES.tercih,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="tm"
          label={testMakerNavGroup.label}
          icon={FileText}
          open={openGroup === "tm"}
          sectionActive={sectionActive === "tm"}
          onToggle={toggleGroup}
          subId="nav-tm-sub"
          subLabel="Test Maker alt menü"
        >
          {renderSubLinks(testMakerNavGroup.children, {
            moduleRoot: TEST_MAKER_ROUTES.root,
            defaultChildHref: TEST_MAKER_ROUTES.olusturucu,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="hr"
          label={hataRecetesiNavGroup.label}
          icon={Pill}
          open={openGroup === "hr"}
          sectionActive={sectionActive === "hr"}
          onToggle={toggleGroup}
          subId="nav-hr-sub"
          subLabel="Hata Reçetesi alt menü"
        >
          {renderSubLinks(hataRecetesiNavGroup.children, {
            moduleRoot: HATA_RECETESI_ROUTES.root,
            defaultChildHref: HATA_RECETESI_ROUTES.havuz,
          })}
        </CoachNavGroup>

        <CoachNavGroup
          id="tr"
          label={taramalarNavGroup.label}
          icon={Layers}
          open={openGroup === "tr"}
          sectionActive={sectionActive === "tr"}
          onToggle={toggleGroup}
          subId="nav-tr-sub"
          subLabel="Taramalar ve Fasiküller alt menü"
        >
          {renderSubLinks(taramalarNavGroup.children, {
            moduleRoot: TARAMALAR_ROUTES.root,
            defaultChildHref: TARAMALAR_ROUTES.analiz,
          })}
        </CoachNavGroup>
      </nav>

      <div className="mt-4 shrink-0 space-y-3 border-t border-slate-200/70 pt-4">
        <SidebarUpgradeCta
          audience="koc"
          title="Planını Yükselt"
          subtitle="Daha fazla öğrenci, Test Maker ve Onyx AI modülleri."
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
