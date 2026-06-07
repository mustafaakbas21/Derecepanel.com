"use client";

import { useMemo } from "react";

import { TestMakerPage } from "@/components/test-maker/test-maker-page";

/** Her route girişinde yeni oturum — React önbelleği state taşımasın */
export default function TestOlusturucuPage() {
  const sessionKey = useMemo(() => Date.now(), []);
  return <TestMakerPage key={sessionKey} />;
}
