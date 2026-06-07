"use client";

import type { TierCard } from "@/lib/analiz/otonom-v3";
import type { OtonomTierId } from "@/lib/analiz/otonom-v3";
import { cn } from "@/lib/utils";

import { TIER_THEME } from "./tier-theme";

export function AmTierStrip({
  tiers,
  activeTier,
  onTierClick,
  onTierPress,
  className,
}: {
  tiers: TierCard[];
  activeTier?: OtonomTierId | "all";
  /** Liste filtresi (isteğe bağlı) */
  onTierClick?: (tier: OtonomTierId | "all") => void;
  /** Kart tıklanınca detay modalı */
  onTierPress?: (tier: OtonomTierId) => void;
  className?: string;
}) {
  return (
    <div className={cn("am-v3-tier-strip space-y-2", className)}>
      {tiers.map((s) => {
        const theme = TIER_THEME[s.id];
        const isActive = activeTier === s.id;
        const interactive = !!(onTierClick || onTierPress);

        return (
          <button
            key={s.id}
            type="button"
            disabled={!interactive}
            onClick={() => {
              onTierPress?.(s.id);
              if (onTierClick) {
                onTierClick(isActive ? "all" : s.id);
              }
            }}
            className={cn(
              "am-v3-tier-card flex w-full items-center gap-3 px-4 py-2.5 text-left transition-shadow",
              interactive && "cursor-pointer hover:shadow-sm",
              !interactive && "cursor-default",
              isActive && "am-v3-tier-card--active"
            )}
            style={{
              background: theme.bg,
              border: `1px solid ${isActive ? theme.color : theme.border}`,
              borderRadius: "1.1rem",
            }}
            aria-pressed={interactive ? isActive : undefined}
            title={onTierPress ? "Detay için tıklayın" : undefined}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: theme.color }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-bold" style={{ color: theme.color }}>
                {s.label}
              </span>
              <span className="ml-2 text-[12px] text-slate-500">{s.desc}</span>
            </div>
            <span
              className="flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold text-white"
              style={{ background: theme.color }}
            >
              {s.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
