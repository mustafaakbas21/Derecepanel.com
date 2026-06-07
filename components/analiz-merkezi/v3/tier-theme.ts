import type { OtonomTierId } from "@/lib/analiz/otonom-v3";

export const TIER_THEME: Record<
  OtonomTierId,
  { color: string; bg: string; border: string }
> = {
  kritik: {
    color: "#991b1b",
    bg: "rgba(153,27,27,0.03)",
    border: "rgba(153,27,27,0.08)",
  },
  dikkat: {
    color: "#92400e",
    bg: "rgba(146,64,14,0.03)",
    border: "rgba(146,64,14,0.08)",
  },
  normal: {
    color: "#065f46",
    bg: "rgba(6,95,70,0.03)",
    border: "rgba(6,95,70,0.08)",
  },
};
