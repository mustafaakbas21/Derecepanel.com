"use client";

import { Bell, ChevronDown, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/appointments/current-user";
import { findStudentRecordForUser } from "@/lib/konu-takip/student-scope";
import { studentProfile } from "@/lib/student/dummy-data";

function useStudentTopBarProfile() {
  const user = getCurrentUser();
  const record = findStudentRecordForUser(user);
  const name = user?.name || record?.name || studentProfile.name;
  const role =
    record?.sinifBranch && record.alan
      ? `${record.sinifBranch} · ${record.alan}`
      : studentProfile.role;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr") ?? "")
    .join("");
  return { name, role, initials: initials || studentProfile.avatarInitials };
}

export function StudentTopBar() {
  const profile = useStudentTopBarProfile();

  return (
    <header className="coach-chrome flex h-[80px] shrink-0 items-center gap-4 px-8">
      <div className="relative w-full max-w-2xl flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Deneme veya konu ara..."
          className="h-12 w-full rounded-full border-0 bg-white pl-12 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-orange-500/20"
          style={{ boxShadow: "var(--card-shadow-sm)" }}
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 transition hover:text-slate-900"
          style={{ boxShadow: "var(--card-shadow-sm)" }}
          aria-label="Bildirimler"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span
            className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full ring-2 ring-white"
            style={{ background: "#f97316" }}
          />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-2 transition hover:shadow-md"
          style={{ boxShadow: "var(--card-shadow-sm)" }}
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback
              className="rounded-full text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}
            >
              {profile.initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-[13px] font-semibold text-slate-800">
              {profile.name}
            </p>
            <p className="truncate text-[11px] text-slate-400">{profile.role}</p>
          </div>
          <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  );
}
