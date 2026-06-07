import Link from "next/link";

import { DereceLogo } from "@/components/coach/derece-logo";

export function StudentBrand() {
  return (
    <Link
      href="/ogrenci"
      className="flex h-[80px] shrink-0 flex-col items-start justify-center gap-1 bg-white px-7"
    >
      <DereceLogo height={30} />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Öğrenci paneli
      </span>
    </Link>
  );
}
