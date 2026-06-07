"use client";

import { useEffect, useState } from "react";

import type { OnyxChatMessage } from "@/components/onyx/onyx-chat-panel";

/** Kesilen son Onyx mesajı için devam butonu indeksi */
export function useOnyxContinuity(
  messages: OnyxChatMessage[],
  isLoading: boolean
) {
  const [continueIndex, setContinueIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      setContinueIndex(null);
      return;
    }

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "onyx" && msg.truncated && !msg.continued) {
        setContinueIndex(i);
        return;
      }
    }
    setContinueIndex(null);
  }, [messages, isLoading]);

  const findUserPromptBefore = (onyxIndex: number): string => {
    for (let j = onyxIndex - 1; j >= 0; j--) {
      const m = messages[j];
      if (m?.role === "user") return m.content;
    }
    return "";
  };

  return { continueIndex, findUserPromptBefore };
}
