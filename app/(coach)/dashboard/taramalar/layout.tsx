import type { ReactNode } from "react";

import "@/styles/taramalar.css";

type Props = { children: ReactNode };

export default function TaramalarLayout({ children }: Props) {
  return (
    <div className="box-border flex min-h-0 w-full flex-1 flex-col px-9 pb-10 pt-5">
      {children}
    </div>
  );
}
