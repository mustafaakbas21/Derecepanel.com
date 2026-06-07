import type { ReactNode } from "react";

import "@/styles/hata-recetesi.css";

type Props = { children: ReactNode };

/** Alt menü yalnızca sidebar'da — sayfa içi üst menü yok */
export default function HataRecetesiLayout({ children }: Props) {
  return <>{children}</>;
}
