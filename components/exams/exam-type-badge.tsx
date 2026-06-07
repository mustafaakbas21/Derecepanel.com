import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SinavTipi } from "@/lib/exams/types";

const styles: Record<SinavTipi, string> = {
  TYT: "bg-sky-50 text-sky-800 border-sky-200",
  AYT: "bg-blue-50 text-blue-800 border-blue-200",
  YDT: "bg-teal-50 text-teal-800 border-teal-200",
};

export function ExamTypeBadge({ sinav }: { sinav: SinavTipi }) {
  return (
    <Badge className={cn("border font-semibold", styles[sinav])}>
      {sinav}
    </Badge>
  );
}

export function DurumBadge({ durum }: { durum: string }) {
  const label =
    durum === "aktif" ? "Yayında" : durum === "tamamlandi" ? "Tamamlandı" : "Taslak";
  const cls =
    durum === "aktif"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : durum === "tamamlandi"
        ? "bg-slate-100 text-slate-700 border-slate-200"
        : "bg-amber-50 text-amber-800 border-amber-200";
  return (
    <Badge className={cn("border font-medium", cls)}>
      {label}
    </Badge>
  );
}
