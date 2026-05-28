import Link from "next/link";

import { DereceLogoMark } from "@/components/coach/derece-logo";

export function CoachBrand() {
  return (
    <Link
      href="/"
      className="flex h-[80px] shrink-0 items-center gap-3.5 bg-white px-7"
    >
      <DereceLogoMark size={32} />
      <span className="text-[19px] font-bold tracking-[-0.02em] text-slate-900 lowercase">
        derecepanel
      </span>
    </Link>
  );
}
