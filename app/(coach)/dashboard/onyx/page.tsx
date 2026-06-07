import { OnyxApp } from "@/components/onyx/onyx-app";
import { getServerOnyxStudentOptions } from "@/lib/onyx/onyx-student-options";

export const metadata = {
  title: "Onyx AI | DerecePanel",
  description:
    "3 sütunlu Onyx komuta merkezi — sohbet, kalıcı bellek ve analiz paneli",
};

/**
 * Koç main padding'ini iptal eder; 3 sütun yüksekliği OnyxChatPanel'de kilitlenir.
 */
export default function OnyxPage() {
  const initialStudents = getServerOnyxStudentOptions();

  return (
    <div className="onyx-page-host -mx-9 flex min-h-0 flex-1 flex-col overflow-hidden">
      <OnyxApp
        role="coach"
        initialStudents={initialStudents}
        className="min-h-0 flex-1 h-full w-full"
      />
    </div>
  );
}
