"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  FileText,
  Home,
  ListTodo,
  LogOut,
  Users,
} from "lucide-react";

import { navItems } from "@/lib/coach/dummy-data";
import { testMakerNavGroup } from "@/lib/coach/nav-config";
import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  home: Home,
  users: Users,
  calendar: CalendarDays,
  transactions: ListTodo,
} as const;

function isNavActive(pathname: string, href: string) {
  if (href === "#") return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isTestMakerPath(pathname: string) {
  return (
    pathname === TEST_MAKER_ROUTES.root ||
    pathname.startsWith(`${TEST_MAKER_ROUTES.root}/`)
  );
}

export function CoachSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const tmActive = isTestMakerPath(pathname);
  const [tmOpen, setTmOpen] = useState(tmActive);

  useEffect(() => {
    if (tmActive) setTmOpen(true);
  }, [tmActive]);

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <aside className="sidebar-panel flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-5 pt-5">
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {navItems.menu.map((item) => {
          const Icon = iconMap[item.icon];
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium transition-all duration-200",
                active
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/12"
                  : "text-slate-600 hover:bg-white/90 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-[1.125rem] w-[1.125rem] shrink-0",
                  active ? "text-white" : "text-slate-400"
                )}
                strokeWidth={active ? 2.25 : 2}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div
          className={cn("nav-group mt-1", tmOpen && "nav-group--open")}
          data-nav-group
        >
          <button
            type="button"
            className={cn(
              "nav-item nav-group__trigger flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[15px] font-medium transition-all",
              tmActive
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/12"
                : "text-slate-600 hover:bg-white/90 hover:text-slate-900"
            )}
            aria-expanded={tmOpen}
            aria-controls="nav-tm-sub"
            onClick={() => setTmOpen((o) => !o)}
          >
            <FileText
              className={cn(
                "h-[1.125rem] w-[1.125rem] shrink-0",
                tmActive ? "text-white" : "text-slate-400"
              )}
              strokeWidth={tmActive ? 2.25 : 2}
            />
            <span className="flex-1">{testMakerNavGroup.label}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                tmOpen && "rotate-180",
                tmActive ? "text-white/80" : "text-slate-400"
              )}
            />
          </button>
          <div
            id="nav-tm-sub"
            className={cn(
              "nav-group__sub ml-3 mt-0.5 flex flex-col gap-0.5 border-l-2 border-slate-200/90 pl-3",
              !tmOpen && "hidden"
            )}
            role="group"
            aria-label="Test Maker alt menü"
          >
            {testMakerNavGroup.children.map((sub) => {
              const subActive =
                pathname === sub.href ||
                (sub.href === TEST_MAKER_ROUTES.olusturucu &&
                  pathname === TEST_MAKER_ROUTES.root);
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className={cn(
                    "rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                    subActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-white/80 hover:text-slate-800"
                  )}
                >
                  {sub.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="mt-4 shrink-0 space-y-3 border-t border-slate-200/70 pt-4">
        <div
          className="overflow-hidden rounded-2xl bg-slate-900 p-4"
          style={{ boxShadow: "0 6px 24px rgba(15,23,42,0.18)" }}
        >
          <p className="text-sm font-bold leading-snug text-white">Pro&apos;ya Geç!</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Sınırsız öğrenci ve gelişmiş raporlar.
          </p>
          <button
            type="button"
            className="mt-4 w-full rounded-xl py-2.5 text-xs font-bold text-slate-900 transition hover:brightness-105"
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
              boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
            }}
          >
            Şimdi Yükselt
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-3 text-[15px] font-medium text-slate-600 transition-all hover:border-red-200/80 hover:bg-white hover:text-red-600"
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
