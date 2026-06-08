import { ImageResponse } from "next/og";

import { AppIconImage } from "@/lib/brand/app-icon-image";

/** Google arama sonuçları için 48×48 PNG favicon (48'in katı zorunlu). */
export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<AppIconImage size={48} />, { ...size });
}
