import { GlobalDenemeCockpit } from "@/components/exams/global-deneme/GlobalDenemeCockpit";

export default function AdminGlobalExamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Global Deneme Takvimi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tüm platform için ortak deneme takvimini yönetin.
        </p>
      </div>
      <GlobalDenemeCockpit />
    </div>
  );
}
