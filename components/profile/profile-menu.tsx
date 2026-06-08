"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Settings, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CoachProfileDetailDialog } from "@/components/profile/coach-profile-detail-dialog";
import { CoachProfileSettingsDialog } from "@/components/profile/coach-profile-settings-dialog";
import { StudentProfileDetailDialog } from "@/components/profile/student-profile-detail-dialog";
import { StudentProfileSettingsDialog } from "@/components/profile/student-profile-settings-dialog";
import type { CoachProfileDto, StudentProfileDto } from "@/lib/appwrite/profile-types";
import { cn } from "@/lib/utils";

type PanelRole = "coach" | "student";

function initialsFromName(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toLocaleUpperCase("tr") ?? "")
      .join("") || "?"
  );
}

type ProfileMenuProps = {
  role: PanelRole;
  fallbackName?: string;
  fallbackSubtitle?: string;
  showName?: boolean;
};

export function ProfileMenu({
  role,
  fallbackName = role === "coach" ? "Koç" : "Öğrenci",
  fallbackSubtitle,
  showName = role === "student",
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<CoachProfileDto | StudentProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        profile?: CoachProfileDto | StudentProfileDto;
      };
      if (data.profile) setProfile(data.profile);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const displayName =
    profile?.role === "coach"
      ? profile.displayName
      : profile?.role === "student"
        ? profile.name
        : fallbackName;

  const subtitle =
    profile?.role === "coach"
      ? profile.specialty || "YKS Koçu"
      : profile?.role === "student"
        ? `${profile.sinifBranch} · ${profile.alan}`
        : fallbackSubtitle;

  const initials = initialsFromName(displayName);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-2 transition hover:shadow-md"
          style={{ boxShadow: "var(--card-shadow-sm)" }}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback
              className="rounded-full text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          {showName ? (
            <div className="hidden min-w-0 text-left sm:block">
              <p className="truncate text-[13px] font-semibold text-slate-800">
                {loading ? "…" : displayName}
              </p>
              {subtitle ? (
                <p className="truncate text-[11px] text-slate-400">{subtitle}</p>
              ) : null}
            </div>
          ) : null}
          <ChevronDown
            className={cn(
              "hidden h-3.5 w-3.5 text-slate-400 transition sm:block",
              open && "rotate-180"
            )}
          />
        </button>

        {open ? (
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            role="menu"
          >
            <div className="border-b border-slate-100 px-3 py-2.5">
              <p className="text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500">
                {profile?.role === "coach"
                  ? `@${profile.username}`
                  : profile?.role === "student"
                    ? `@${profile.username}`
                    : role === "coach"
                      ? "Koç paneli"
                      : "Öğrenci paneli"}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setOpen(false);
                setDetailOpen(true);
              }}
            >
              <User className="h-4 w-4 text-slate-400" />
              Detay
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setOpen(false);
                setSettingsOpen(true);
              }}
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Ayarlar
            </button>
          </div>
        ) : null}
      </div>

      {role === "coach" ? (
        <>
          <CoachProfileDetailDialog
            open={detailOpen}
            onOpenChange={setDetailOpen}
            profile={profile?.role === "coach" ? profile : null}
            onRefresh={loadProfile}
          />
          <CoachProfileSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            profile={profile?.role === "coach" ? profile : null}
            onSaved={loadProfile}
          />
        </>
      ) : (
        <>
          <StudentProfileDetailDialog
            open={detailOpen}
            onOpenChange={setDetailOpen}
            profile={profile?.role === "student" ? profile : null}
            onRefresh={loadProfile}
          />
          <StudentProfileSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            profile={profile?.role === "student" ? profile : null}
            onSaved={loadProfile}
          />
        </>
      )}
    </>
  );
}
