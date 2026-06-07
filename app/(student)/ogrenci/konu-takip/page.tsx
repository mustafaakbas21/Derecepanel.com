import { Suspense } from "react";

import { StudentKonuTakipPage } from "@/components/student/student-konu-takip-page";

export default function OgrenciKonuTakipPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <StudentKonuTakipPage />
    </Suspense>
  );
}
