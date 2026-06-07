import { cn } from "@/lib/utils";

export function StudentDashboardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse space-y-5", className)}
      aria-busy
      aria-label="Panel yükleniyor"
    >
      <div className="h-[140px] rounded-2xl border border-slate-200 bg-white" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-2 w-full rounded-full bg-slate-100" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="h-20 rounded-2xl bg-slate-100" />
            <div className="h-20 rounded-2xl bg-slate-100" />
          </div>
          <div className="h-48 rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
