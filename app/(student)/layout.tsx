"use client";

import { CoachScrollReset } from "@/components/coach/coach-scroll-reset";
import { StudentAuthCookieSync } from "@/components/student/student-auth-cookie-sync";
import { StudentBrand } from "@/components/student/student-brand";
import { StudentSidebar } from "@/components/student/student-sidebar";
import { StudentTopBar } from "@/components/student/student-top-bar";
import { AuthGate } from "@/components/auth/auth-gate";

const MAIN_SCROLL_ID = "student-main-scroll";

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate role="student">
      <StudentAuthCookieSync />
      <div className="dashboard-viewport">
        <div className="dashboard-shell flex h-screen overflow-clip">
          <div className="coach-chrome flex w-[280px] shrink-0 flex-col overflow-clip bg-white">
            <StudentBrand />
            <StudentSidebar />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-clip">
            <StudentTopBar />
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
