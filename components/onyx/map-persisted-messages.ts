import type { OnyxMessageListItem } from "@/components/onyx/onyx-message-list";
import type { PersistedChatMessageDto } from "@/lib/onyx-client";
import {
  onyxAttachmentUrl,
  parseOnyxMessageMetadata,
} from "@/lib/onyx/chat-message-metadata";
import { resolveVisionSolveSkillResponse } from "@/lib/onyx/skill-adapters";

export function mapPersistedMessagesToChat(
  messages: PersistedChatMessageDto[]
): OnyxMessageListItem[] {
  return messages.map((m) => {
    const meta = parseOnyxMessageMetadata(m.metadata);
    const imagePreview = meta?.imageAttachmentId
      ? onyxAttachmentUrl(meta.imageAttachmentId)
      : undefined;

    const onyxResponse =
      meta?.onyxResponse ??
      resolveVisionSolveSkillResponse({
        deepErrorDiagnosis: meta?.deepErrorDiagnosis,
        reply: m.role === "onyx" ? m.content : undefined,
      }) ??
      undefined;

    return {
      role: m.role,
      content: m.content,
      ...(onyxResponse ? { onyxResponse } : {}),
      ...(meta?.deepErrorDiagnosis
        ? { deepErrorDiagnosis: meta.deepErrorDiagnosis }
        : {}),      ...(meta?.careerCounseling
        ? { careerCounseling: meta.careerCounseling }
        : {}),
      ...(imagePreview ? { imagePreview } : {}),
      ...(meta?.curriculumAdded
        ? {
            curriculumAdded: true,
            curriculumTopicLabel: meta.curriculumTopicLabel,
          }
        : {}),
    };
  });
}
