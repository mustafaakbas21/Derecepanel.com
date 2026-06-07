import Link from "next/link";

import { DereceLogo } from "@/components/coach/derece-logo";

export function CoachBrand() {
  return (
    <Link
      href="/"
      className="flex h-[80px] shrink-0 items-center bg-white px-7"
    >
      <DereceLogo height={34} />
    </Link>
  );
}
