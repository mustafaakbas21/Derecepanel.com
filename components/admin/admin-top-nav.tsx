"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";

import { AdminBrand } from "@/components/admin/admin-brand";
import { AdminPillTabs } from "@/components/admin/admin-ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { adminPillNavItems } from "@/lib/admin/admin-nav-config";
import { clearAuthSession, getAuthUsername } from "@/lib/auth/local-auth";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function AdminTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setUsername(getAuthUsername());
  }, []);

  const handleSearch = (value: string) => {
    const q = value.trim();
    if (!q) return;
    router.push(`/admin/koclar?q=${encodeURIComponent(q)}`);
  };

  const logout = async () => {
    await clearAuthSession();
    router.replace("/admin/giris");
  };

  return (
    <header className="z-30 shrink-0 border-b border-slate-200/80 bg-[#F5F7FA]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <AdminBrand compact />
          <div className="hidden min-w-0 flex-1 lg:block">
            <AdminPillTabs items={adminPillNavItems} activeHref={pathname} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(search);
                }}
                placeholder="Koç veya öğrenci ara…"
                className="h-10 w-56 rounded-full border-0 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
              aria-label="Bildirimler"
              title="Yakında"
            >
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-2 shadow-sm">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="rounded-full bg-slate-900 text-xs font-bold text-white">
                  {initials(username || "Admin")}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[100px] truncate text-sm font-semibold text-slate-700 sm:block">
                {username || "Kurucu"}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => void logout()}
              aria-label="Çıkış yap"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="lg:hidden">
          <AdminPillTabs items={adminPillNavItems} activeHref={pathname} />
        </div>
      </div>
    </header>
  );
}
