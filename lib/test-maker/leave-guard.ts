import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";

export type TestMakerLeaveGuard = {
  hasUnsavedChanges: () => boolean;
  discardChanges: () => void;
};

let activeGuard: TestMakerLeaveGuard | null = null;
let leaveModalHandler: ((href: string) => void) | null = null;

export function isTestMakerOlusturucuPath(pathname: string): boolean {
  return pathname === TEST_MAKER_ROUTES.olusturucu;
}

export function registerTestMakerLeaveGuard(guard: TestMakerLeaveGuard | null): void {
  activeGuard = guard;
}

export function registerTestMakerLeaveModal(handler: ((href: string) => void) | null): void {
  leaveModalHandler = handler;
}

/** false = navigasyon engellendi, modal açılacak */
export function testMakerTryNavigate(href: string, currentPath: string): boolean {
  if (!isTestMakerOlusturucuPath(currentPath)) return true;
  if (href === currentPath) return true;
  if (!activeGuard?.hasUnsavedChanges()) return true;
  leaveModalHandler?.(href);
  return false;
}

export function testMakerHasUnsavedChanges(): boolean {
  return activeGuard?.hasUnsavedChanges() ?? false;
}
