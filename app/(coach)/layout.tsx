import { CoachBrand } from "@/components/coach/coach-brand";
import { CoachSidebar } from "@/components/coach/coach-sidebar";
import { CoachTopBar } from "@/components/coach/coach-top-bar";
import { AppToaster } from "@/components/providers";

export default function CoachLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dashboard-viewport">
      <div className="dashboard-shell flex h-screen overflow-hidden">
        <div className="flex w-[280px] shrink-0 flex-col bg-white">
          <CoachBrand />
          <CoachSidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CoachTopBar />
          <main className="coach-panel-main min-h-0 flex-1 overflow-y-auto px-9 pb-10 pt-5">
            {children}
          </main>
        </div>
        <AppToaster />
      </div>
    </div>
  );
}
