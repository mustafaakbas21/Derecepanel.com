import { SavedWeeklyProgramsPage } from "@/components/weekly-planner/saved-weekly-programs-page";

export const metadata = {
  title: "Kayıtlı Haftalık Programlar | DerecePanel",
  description: "Öğrencilere gönderilmiş haftalık program arşivi",
};

export default function KayitliHaftalikProgramlarPage() {
  return <SavedWeeklyProgramsPage />;
}
