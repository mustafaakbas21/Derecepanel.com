import type { OnyxCareerCounseling } from "@/lib/onyx/career-counseling";
import type { OnyxDeepErrorDiagnosis } from "@/lib/onyx/deep-error-diagnosis";
import type { OnyxSkillResponse } from "@/lib/onyx/skill-types";

/** Onyx sohbet mesajı — kalıcı metadata (JSON) */

export type OnyxChatMessageMetadata = {
  hasImage?: boolean;
  /** `data/onyx-chat-attachments` veya API üzerinden servis */
  imageAttachmentId?: string;
  curriculumAdded?: boolean;
  curriculumTopicLabel?: string;
  /** Skill-Based Response zarfı (öncelikli UI) */
  onyxResponse?: OnyxSkillResponse;
  /** Derin hata analizi raporu (vision çözüm) — geriye dönük */
  deepErrorDiagnosis?: OnyxDeepErrorDiagnosis;
  /** Kariyer & tercih danışmanlığı — geriye dönük */
  careerCounseling?: OnyxCareerCounseling;
};

export function parseOnyxMessageMetadata(
  raw: string | null | undefined
): OnyxChatMessageMetadata | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as OnyxChatMessageMetadata;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function serializeOnyxMessageMetadata(
  meta: OnyxChatMessageMetadata | null | undefined
): string | undefined {
  if (!meta || Object.keys(meta).length === 0) return undefined;
  return JSON.stringify(meta);
}

export function onyxAttachmentUrl(attachmentId: string): string {
  return `/api/onyx/attachment?id=${encodeURIComponent(attachmentId)}`;
}
