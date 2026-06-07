import { Suspense } from "react";

import { UploadResultsPage } from "@/components/exams/upload-results-page";

export default function YuklemeRoute() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-500">Yükleniyor…</div>}>
      <UploadResultsPage />
    </Suspense>
  );
}
