import { Bell, ChevronDown, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { coachProfile } from "@/lib/coach/dummy-data";

export function CoachTopBar() {
  return (
    <header className="flex h-[80px] shrink-0 items-center gap-4 px-8">
      {/* Wide search */}
      <div className="relative w-full max-w-2xl flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Öğrenci veya deneme ara..."
          className="h-12 w-full rounded-full border-0 bg-white pl-12 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-orange-500/20"
          style={{ boxShadow: "var(--card-shadow-sm)" }}
        />
      </div>

      {/* Right actions */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 transition hover:text-slate-900"
          style={{ boxShadow: "var(--card-shadow-sm)" }}
          aria-label="Ara"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
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
              {coachProfile.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  );
}
