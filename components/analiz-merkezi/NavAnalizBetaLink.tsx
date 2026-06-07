"use client";

import Link from "next/link";

import { ANALIZ_MERKEZI_ROUTE } from "@/lib/coach/denemeler-nav-config";
import { cn } from "@/lib/utils";

import "./nav-analiz-beta.css";

type Props = {
  active: boolean;
};

/** İki satırlı etiket + amber BETA pill — stiller nav-analiz-beta.css (tüm koç sayfaları) */
export function NavAnalizBetaLink({ active }: Props) {
  return (
    <Link
      href={ANALIZ_MERKEZI_ROUTE}
      className={cn(
        "nav-analiz-beta-link coach-nav-sub-link !px-2.5 !py-2",
        active && "coach-nav-sub-link--active nav-analiz-beta-link--active"
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className="nav-analiz-beta">
        <span className="nav-analiz-beta__row1">Analiz ve Raporlama</span>
        <span className="nav-analiz-beta__row2">
          <span className="nav-analiz-beta__suffix">Merkezi</span>
          <span className="nav-analiz-beta__pill" aria-label="Beta sürüm">
            BETA
          </span>
        </span>
      </span>
    </Link>
  );
}
