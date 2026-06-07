"use client";

import { OnyxChatPanel } from "@/components/onyx/onyx-chat-panel";
import { useStudentKonuTakip } from "@/hooks/use-student-konu-takip";
import type { OnyxStudentOption } from "@/lib/onyx/onyx-student-options";
import { getCurrentUser } from "@/lib/weekly-planner/student-scope";

export type OnyxAppCoachProps = {
  role: "coach";
  initialStudents?: OnyxStudentOption[];
  className?: string;
};

export type OnyxAppStudentProps = {
  role: "student";
  className?: string;
};

export type OnyxAppProps = OnyxAppCoachProps | OnyxAppStudentProps;

function OnyxAppCoach({
  initialStudents = [],
  className,
}: Omit<OnyxAppCoachProps, "role">) {
  return (
    <OnyxChatPanel
      role="coach"
      currentUser={{ id: "coach", role: "coach", name: "Koç" }}
      initialStudents={initialStudents}
      className={className}
    />
  );
}

function OnyxAppStudent({ className }: Omit<OnyxAppStudentProps, "role">) {
  const { studentId } = useStudentKonuTakip();
  const user = typeof window !== "undefined" ? getCurrentUser() : null;
  const id = studentId || user?.id || "";

  return (
    <OnyxChatPanel
      role="student"
      currentUser={{
        id,
        name: user?.name ?? user?.kullaniciAdi,
        role: "student",
      }}
      targetStudentId={id}
      className={className}
    />
  );
}

/**
 * Koç ve öğrenci Onyx arayüzünün tek giriş noktası.
 * UI, streaming ve vision akışı `OnyxChatPanel` üzerinden paylaşılır.
 */
export function OnyxApp(props: OnyxAppProps) {
  if (props.role === "coach") {
    return (
      <OnyxAppCoach
        initialStudents={props.initialStudents}
        className={props.className}
      />
    );
  }

  return <OnyxAppStudent className={props.className} />;
}
