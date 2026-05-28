"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TEST_MAKER_ROUTES, TEST_MAKER_SUBNAV } from "@/lib/test-maker/constants";
import { cn } from "@/lib/utils";

export function TestMakerNav() {
  const pathname = usePathname();

  return (
    <nav className="tm-subnav" aria-label="Test Maker alt menü">
      <span className="tm-subnav__brand hidden sm:inline">Test Maker</span>
      {TEST_MAKER_SUBNAV.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === TEST_MAKER_ROUTES.olusturucu &&
            pathname === TEST_MAKER_ROUTES.root);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "tm-subnav__link",
              active && "tm-subnav__link--active"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
