import { cn } from "@/lib/utils";

export const DERECE_LOGO_WIDTH = 640;
export const DERECE_LOGO_HEIGHT = 160;

/** Yatay DerecePanel logosu — tüm marka alanlarında tek kaynak (statik PNG yok). */
export function DereceLogo({
  height = 32,
  className,
  priority: _priority,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round((height * DERECE_LOGO_WIDTH) / DERECE_LOGO_HEIGHT);
  const fontSize = Math.round(height * 0.62);

  return (
    <span
      role="img"
      aria-label="DerecePanel"
      className={cn(
        "inline-flex shrink-0 items-baseline whitespace-nowrap leading-none tracking-tight",
        className
      )}
      style={{ width, height, fontSize }}
    >
      <span className="font-extrabold text-slate-900">Derece</span>
      <span className="font-semibold text-slate-500">Panel</span>
    </span>
  );
}

/** @deprecated `DereceLogo` kullanın — `size` yükseklik (px) olarak yorumlanır. */
export function DereceLogoMark({ size = 28 }: { size?: number }) {
  return <DereceLogo height={size} />;
}
