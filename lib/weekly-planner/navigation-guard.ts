/** Otonom haftalık program — kaydedilmemiş çıkış uyarısı (sidebar / link tıklamaları) */

export type WeeklyPlannerLeaveRequest = {
  href: string;
  proceed: () => void;
};

type GuardHandlers = {
  isDirty: () => boolean;
  onLeaveRequest: (req: WeeklyPlannerLeaveRequest) => void;
};

let activeGuard: GuardHandlers | null = null;

export function registerWeeklyPlannerLeaveGuard(handlers: GuardHandlers | null): void {
  activeGuard = handlers;
}

export function isWeeklyPlannerLeaveGuardDirty(): boolean {
  return activeGuard?.isDirty() ?? false;
}

/** true = navigasyon engellendi, modal açılacak */
export function interceptWeeklyPlannerLeave(
  href: string,
  proceed: () => void
): boolean {
  if (!activeGuard?.isDirty()) {
    proceed();
    return false;
  }
  activeGuard.onLeaveRequest({ href, proceed });
  return true;
}
