import type { ReactNode } from "react";

import "@/styles/test-maker-theme.css";
import "@/styles/test-maker-subpages.css";
import "@/styles/test-maker-v2.css";

type Props = { children: ReactNode };

/** Alt menü yalnızca sidebar'da — TestMakerNav kaldırıldı */
export default function TestMakerLayout({ children }: Props) {
  return (
    <div className="tm-module-shell box-border flex min-h-0 w-full flex-1 flex-col px-9 pb-10 pt-5">
      {children}
    </div>
  );
}
