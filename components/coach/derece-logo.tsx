import { cn } from "@/lib/utils";

export const DERECE_LOGO_SRC = "/images/derece-panel-logo.png";
export const DERECE_LOGO_WIDTH = 640;
export const DERECE_LOGO_HEIGHT = 160;

/** Yatay DerecePanel logosu — tüm marka alanlarında tek kaynak. */
export function DereceLogo({
  height = 32,
  className,
  priority,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round((height * DERECE_LOGO_WIDTH) / DERECE_LOGO_HEIGHT);

  return (
    // Yerel statik asset — next/image optimizasyonu landing header'da boyut çöküşüne yol açıyordu.
    <img
      src={DERECE_LOGO_SRC}
      alt="DerecePanel"
      width={width}
      height={height}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={cn("block shrink-0 object-contain object-left", className)}
      style={{ width, height, maxWidth: "none" }}
    />
  );
}

/** @deprecated `DereceLogo` kullanın — `size` yükseklik (px) olarak yorumlanır. */
export function DereceLogoMark({ size = 28 }: { size?: number }) {
  return <DereceLogo height={size} />;
}
