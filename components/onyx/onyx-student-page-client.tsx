"use client";

import { OnyxApp } from "@/components/onyx/onyx-app";

/** @deprecated `OnyxApp role="student"` kullanın */
export function OnyxStudentPageClient({ className }: { className?: string }) {
  return <OnyxApp role="student" className={className} />;
}
