"use client";

import { Megaphone } from "lucide-react";

import { GuardedCoachLink } from "@/components/coach/guarded-coach-link";
import { PAZARLAMA_ROUTE } from "@/lib/coach/pazarlama-nav-config";
import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
};

/** Üst menü — diğer `coach-nav-top-link` öğeleriyle aynı tipografi; BETA rozeti satır içi */
export function NavPazarlamaBetaLink({ active }: Props) {
  return (
    <GuardedCoachLink
      href={PAZARLAMA_ROUTE}
      className={cn("coach-nav-top-link", active && "coach-nav-top-link--active")}
      aria-current={active ? "page" : undefined}
    >
      <Megaphone
        className="coach-nav-top-link__icon shrink-0"
        strokeWidth={active ? 2.25 : 2}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">Pazarlama Asistanı</span>
      <span className="coach-nav-beta-pill" aria-label="Beta sürüm">
        BETA
      </span>
    </GuardedCoachLink>
  );
}
