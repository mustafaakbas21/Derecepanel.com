"use client";

import { OnyxApp } from "@/components/onyx/onyx-app";
import type { OnyxStudentOption } from "@/lib/onyx/onyx-student-options";

export { OnyxChatPanel } from "@/components/onyx/onyx-chat-panel";
export type { OnyxChatMessage } from "@/components/onyx/onyx-chat-panel";

/** @deprecated `OnyxApp role="coach"` kullanın */
export function OnyxCommandCenter({
  initialStudents = [],
  className,
}: {
  initialStudents?: OnyxStudentOption[];
  className?: string;
}) {
  return (
    <OnyxApp
      role="coach"
      initialStudents={initialStudents}
      className={className}
    />
  );
}
