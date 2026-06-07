import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 118,
            height: 118,
            color: "#ffffff",
            fontSize: 96,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.04em",
            position: "relative",
          }}
        >
          D
          <div
            style={{
              position: "absolute",
              width: 10,
              height: 34,
              background: "rgba(13, 148, 136, 0.35)",
              borderRadius: 3,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 34,
              height: 10,
              background: "rgba(13, 148, 136, 0.35)",
              borderRadius: 3,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
