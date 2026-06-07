import Link from "next/link";

import { DereceLogo } from "@/components/coach/derece-logo";

export function AdminBrand({ compact }: { compact?: boolean }) {
  return (
    <Link
      href="/admin"
      className={compact ? "flex shrink-0 items-center" : "flex h-[80px] shrink-0 items-center bg-white px-7"}
    >
      <div className="flex flex-col">
        <DereceLogo height={30} />
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Kurucu Paneli
        </span>
      </div>
    </Link>
  );
}
