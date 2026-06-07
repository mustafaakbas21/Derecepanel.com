import { TEKMER_PARTNER } from "@/lib/marketing/landing-page-data";
import { cn } from "@/lib/utils";

const LOGO_WIDTH = 450;
const LOGO_HEIGHT = 150;

/** Haliç Tekmer partner logosu — footer için beyaz varyant. */
export function TekmerPartnerLogo({
  height = 22,
  className,
}: {
  height?: number;
  className?: string;
}) {
  const width = Math.round((height * LOGO_WIDTH) / LOGO_HEIGHT);

  return (
    <img
      src={TEKMER_PARTNER.logoSrc}
      alt={TEKMER_PARTNER.logoAlt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={cn("block shrink-0 object-contain object-left", className)}
      style={{ width, height, maxWidth: "none" }}
    />
  );
}
