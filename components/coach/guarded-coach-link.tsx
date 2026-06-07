"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { coachTryNavigate } from "@/lib/coach/guarded-nav";

type Props = ComponentProps<typeof Link>;

export function GuardedCoachLink({ href, onClick, ...rest }: Props) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : (href.pathname ?? "");

  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (!coachTryNavigate(target, pathname)) {
          e.preventDefault();
        }
      }}
    />
  );
}
