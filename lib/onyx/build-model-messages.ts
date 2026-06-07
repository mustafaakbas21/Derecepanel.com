import type { ModelMessage } from "ai";

import type { OnyxChatHistoryTurn } from "@/lib/onyx/chat-history-pruning";
import {
  ONYX_CONTINUE_SYSTEM_TURN,
  type OnyxContinuationContext,
} from "@/lib/onyx/continuity";
import type { OnyxVisionInput } from "@/lib/onyx/groq-server";

export function buildOnyxUserText(
  prompt: string,
  hasVision: boolean
): string {
  return (
    prompt ||
    (hasVision
      ? "Bu soru fotoğrafını ÖSYM formatında analiz et ve akademik çözüm şablonunu kullan."
      : "")
  );
}

/** Groq / AI SDK — system hariç sohbet mesajları */
export function buildOnyxModelMessages(input: {
  prompt: string;
  vision?: OnyxVisionInput;
  continuation?: OnyxContinuationContext;
  chatHistory?: OnyxChatHistoryTurn[];
}): ModelMessage[] {
  const hasVision = Boolean(input.vision?.base64?.trim());
  const userText = buildOnyxUserText(input.prompt, hasVision);
  const continuation = input.continuation;

  if (continuation?.partialReply?.trim()) {
    return [
      {
        role: "user",
        content: continuation.originalUserPrompt.trim() || userText,
      },
      { role: "assistant", content: continuation.partialReply.trim() },
      { role: "user", content: ONYX_CONTINUE_SYSTEM_TURN },
    ];
  }

  const messages: ModelMessage[] = [];
  for (const turn of input.chatHistory ?? []) {
    messages.push({
      role: turn.role,
      content: turn.content,
    });
  }

  if (hasVision) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userText },
        {
          type: "image",
          image: `data:${input.vision!.mimeType};base64,${input.vision!.base64}`,
        },
      ],
    });
  } else {
    messages.push({ role: "user", content: userText });
  }

  return messages;
}
