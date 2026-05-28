import type { ReactNode } from "react";

import { TestMakerNav } from "@/components/test-maker/test-maker-nav";

import "@/styles/test-maker-theme.css";
import "@/styles/test-maker-subpages.css";

type Props = { children: ReactNode };

export default function TestMakerLayout({ children }: Props) {
  return (
    <div className="tm-module-shell flex min-h-0 flex-1 flex-col overflow-hidden">
      <TestMakerNav />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
