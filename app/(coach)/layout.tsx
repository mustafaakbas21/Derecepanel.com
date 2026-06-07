"use client";

import { CoachBrand } from "@/components/coach/coach-brand";
import { CoachScrollReset } from "@/components/coach/coach-scroll-reset";
import { CoachSidebar } from "@/components/coach/coach-sidebar";
import { CoachTopBar } from "@/components/coach/coach-top-bar";
import { AuthGate } from "@/components/auth/auth-gate";

const MAIN_SCROLL_ID = "coach-main-scroll";

export default function CoachLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate role="coach">
      <div className="dashboard-viewport">
        <div className="dashboard-shell flex h-screen overflow-clip">
          <div className="coach-chrome flex w-[280px] shrink-0 flex-col overflow-clip bg-white">
            <CoachBrand />
            <CoachSidebar />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-clip">
            <CoachTopBar />
            <main
              id={MAIN_SCROLL_ID}
              className="coach-panel-main min-h-0 flex-1 overflow-y-auto px-9 pb-10 pt-5"
            >
              {children}
            </main>
          </div>
        </div>
        <CoachScrollReset targetId={MAIN_SCROLL_ID} />
      </div>
    </AuthGate>
  );
}
