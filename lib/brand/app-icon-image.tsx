type AppIconImageProps = {
  size: number;
  /** Büyük boyutlarda D harfinin ortasında artı işareti */
  showCross?: boolean;
};

/** Favicon / apple-touch-icon — `next/og` ImageResponse içinde kullanılır. */
export function AppIconImage({ size, showCross = false }: AppIconImageProps) {
  const radius = Math.round(size * 0.229);
  const fontSize = Math.round(size * 0.58);
  const crossBar = Math.max(2, Math.round(size * 0.075));
  const crossLong = Math.max(6, Math.round(size * 0.2));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        borderRadius: radius,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize,
          fontWeight: 800,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.05em",
          lineHeight: 1,
          position: "relative",
        }}
      >
        D
        {showCross ? (
          <>
            <div
              style={{
                position: "absolute",
                width: crossBar,
                height: crossLong,
                background: "rgba(255, 255, 255, 0.35)",
                borderRadius: Math.max(1, Math.round(crossBar * 0.3)),
              }}
            />
            <div
              style={{
                position: "absolute",
                width: crossLong,
                height: crossBar,
                background: "rgba(255, 255, 255, 0.35)",
                borderRadius: Math.max(1, Math.round(crossBar * 0.3)),
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
