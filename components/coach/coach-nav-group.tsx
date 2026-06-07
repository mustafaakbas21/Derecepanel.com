"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  icon: LucideIcon;
  open: boolean;
  sectionActive: boolean;
  onToggle: (id: string) => void;
  subId: string;
  subLabel: string;
  children: ReactNode;
};

export function CoachNavGroup({
  id,
  label,
  icon: Icon,
  open,
  sectionActive,
  onToggle,
  subId,
  subLabel,
  children,
}: Props) {
  return (
    <div
      className={cn("coach-nav-group", open && "coach-nav-group--open")}
      data-nav-group={id}
    >
      <button
        type="button"
        className={cn(
          "coach-nav-group__trigger",
          sectionActive && "coach-nav-group__trigger--section-active"
        )}
        aria-expanded={open}
        aria-controls={subId}
        onClick={() => onToggle(id)}
      >
        <Icon
          className="coach-nav-group__icon"
          strokeWidth={sectionActive ? 2.25 : 2}
        />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={cn(
            "coach-nav-group__chevron",
            open && "coach-nav-group__chevron--open"
          )}
        />
      </button>
      <div
        id={subId}
        className="coach-nav-group__sub-wrap"
        role="group"
        aria-label={subLabel}
        aria-hidden={!open}
      >
        <div className="coach-nav-group__sub">{children}</div>
      </div>
    </div>
  );
}
