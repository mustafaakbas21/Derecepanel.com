import { cn } from "@/lib/utils";

/** 0–1 oran için ince SVG ilerleme halkası. */
export function ProgressRing({
  ratio,
  size = 44,
  stroke = 5,
  className,
  variant = "default",
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  className?: string;
  /** Koyu arka plan üzerinde açık track + metin rengi için `onDark` + `className="text-white"` */
  variant?: "default" | "onDark";
}) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  const pct = Math.round(clamped * 100);

  const color =
    clamped >= 0.67 ? "#059669" : clamped >= 0.34 ? "#f97316" : "#94a3b8";
  const trackColor = variant === "onDark" ? "rgba(255,255,255,0.22)" : "#e2e8f0";
  const labelSize =
    size >= 72 ? "text-sm" : size >= 56 ? "text-xs" : "text-[11px]";

  return (
    <div
      className={cn(
        "relative shrink-0 text-slate-700",
        variant === "onDark" && "text-white",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-bold tabular-nums text-inherit",
          labelSize
        )}
      >
        {pct}%
      </span>
    </div>
  );
}
