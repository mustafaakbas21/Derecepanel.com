import { HAFTALIK_PROGRAM_ROUTES } from "@/lib/coach/haftalik-program-nav-config";

export type WeeklyPlannerLeaveGuard = {
  hasUnsavedChanges: () => boolean;
  discardChanges: () => void;
};

let activeGuard: WeeklyPlannerLeaveGuard | null = null;
let leaveModalHandler: ((href: string) => void) | null = null;

export function registerWeeklyPlannerLeaveGuard(guard: WeeklyPlannerLeaveGuard | null): void {
  activeGuard = guard;
}

export function registerWeeklyPlannerLeaveModal(
  handler: ((href: string) => void) | null
): void {
  leaveModalHandler = handler;
}

export function isWeeklyPlannerEditorPath(pathname: string): boolean {
  return pathname === HAFTALIK_PROGRAM_ROUTES.olusturucu;
}

/** false = navigasyon engellendi, modal açılacak */
export function weeklyPlannerTryNavigate(href: string, currentPath: string): boolean {
  if (!isWeeklyPlannerEditorPath(currentPath)) return true;
  if (href === currentPath) return true;
  if (!activeGuard?.hasUnsavedChanges()) return true;
  leaveModalHandler?.(href);
  return false;
}

export function weeklyPlannerHasUnsavedChanges(): boolean {
  return activeGuard?.hasUnsavedChanges() ?? false;
}
