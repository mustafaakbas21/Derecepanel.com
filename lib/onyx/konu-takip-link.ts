import { STUDENT_KONU_TAKIP_ROUTES } from "@/lib/student/sidebar-nav-config";
import { KONU_TAKIP_ROUTES } from "@/lib/coach/konu-takip-nav-config";
import type { OnyxDeepErrorDiagnosis } from "@/lib/onyx/deep-error-diagnosis";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";

/** Onyx teşhisinden Konu Takip sayfası URL'i */
export function buildOnyxKonuTakipHref(
  diagnosis: OnyxDeepErrorDiagnosis,
  role: OnyxRole
): string | null {
  const m = diagnosis.mufredatEslestirme;
  if (!m?.subjectId || !m?.topicId) return null;

  const params = new URLSearchParams({
    ders: m.subjectId,
    konu: m.topicId,
  });

  if (role === "coach") {
    return `${KONU_TAKIP_ROUTES.takip}?${params.toString()}`;
  }

  return `${STUDENT_KONU_TAKIP_ROUTES.durum}?${params.toString()}`;
}
