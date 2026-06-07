import { getCurrentUser } from "@/lib/appointments/current-user";
import { getCoachDisplayName, matchIdsForUser } from "@/lib/appointments/student-scope";
import type { CurrentUser } from "@/lib/appointments/types";
import { resolveStudentTrackingId } from "@/lib/konu-takip/student-scope";
import { getBookById, loadAssignments } from "@/lib/library/library-storage";
import type { BookAssignment, LibraryBook } from "@/lib/library/types";

export { getCoachDisplayName, getCurrentUser };

export type StudentAssignmentView = BookAssignment & {
  book: LibraryBook | null;
};

export function studentAssignmentIds(user: CurrentUser | null = getCurrentUser()): string[] {
  if (!user) return [];
  const ids = new Set(matchIdsForUser(user));
  const tracking = resolveStudentTrackingId(user);
  if (tracking) ids.add(tracking);
  if (user.ogrenciId) ids.add(user.ogrenciId);
  if (user.studentCode) ids.add(user.studentCode);
  return [...ids].filter(Boolean);
}

export function listStudentAssignments(
  user: CurrentUser | null = getCurrentUser()
): StudentAssignmentView[] {
  const ids = new Set(studentAssignmentIds(user));
  if (!ids.size) return [];

  return loadAssignments()
    .filter((a) => ids.has(a.studentId))
    .map((a) => ({
      ...a,
      book: getBookById(a.bookId) ?? null,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function computeStudentLibraryStats(items: StudentAssignmentView[]) {
  const total = items.length;
  const withBook = items.filter((i) => i.book);
  const completed = items.filter((i) => i.progress >= 100).length;
  const inProgress = items.filter((i) => i.progress > 0 && i.progress < 100).length;
  const notStarted = items.filter((i) => i.progress <= 0).length;
  const avgProgress = total
    ? Math.round(items.reduce((s, i) => s + i.progress, 0) / total)
    : 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dueSoon = items.filter((i) => {
    if (!i.dueDate || i.progress >= 100) return false;
    const t = Date.parse(`${i.dueDate}T00:00:00`);
    if (Number.isNaN(t)) return false;
    const days = Math.round((t - now.getTime()) / 86400000);
    return days >= 0 && days <= 7;
  }).length;

  const overdue = items.filter((i) => {
    if (!i.dueDate || i.progress >= 100) return false;
    const t = Date.parse(`${i.dueDate}T00:00:00`);
    return !Number.isNaN(t) && t < now.getTime();
  }).length;

  const byKind: Record<string, number> = {};
  for (const item of withBook) {
    const k = item.book!.kind;
    byKind[k] = (byKind[k] ?? 0) + 1;
  }

  return {
    total,
    completed,
    inProgress,
    notStarted,
    avgProgress,
    dueSoon,
    overdue,
    byKind,
  };
}

export function formatDueLabel(dueDate?: string): { label: string; tone: "default" | "warn" | "danger" } {
  if (!dueDate) return { label: "Tarih yok", tone: "default" };
  const t = Date.parse(`${dueDate}T00:00:00`);
  if (Number.isNaN(t)) return { label: dueDate, tone: "default" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((t - today.getTime()) / 86400000);
  const formatted = new Date(t).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
  if (days < 0) return { label: `${formatted} · gecikti`, tone: "danger" };
  if (days === 0) return { label: `${formatted} · bugün`, tone: "warn" };
  if (days === 1) return { label: `${formatted} · yarın`, tone: "warn" };
  if (days <= 7) return { label: `${formatted} · ${days} gün`, tone: "warn" };
  return { label: formatted, tone: "default" };
}
