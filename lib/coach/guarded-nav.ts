import { testMakerTryNavigate } from "@/lib/test-maker/leave-guard";
import { weeklyPlannerTryNavigate } from "@/lib/weekly-planner/leave-guard";

/** false = navigasyon engellendi, ilgili editör modalı açılacak */
export function coachTryNavigate(href: string, currentPath: string): boolean {
  if (!weeklyPlannerTryNavigate(href, currentPath)) return false;
  if (!testMakerTryNavigate(href, currentPath)) return false;
  return true;
}
