import { Suspense } from "react";

import { StudentPersonalSavedProgramsPage } from "@/components/student/student-personal-saved-programs-page";

export default function OgrenciBireyselKayitliProgramlarPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <StudentPersonalSavedProgramsPage />
    </Suspense>
  );
}
