"use client";

import { OnyxAssistantMessageBubble } from "@/components/onyx/onyx-assistant-message-bubble";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  streaming?: boolean;
  className?: string;
  showContinue?: boolean;
  continueLoading?: boolean;
  onContinue?: () => void;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
};

export function StandardChatBubble({
  text,
  streaming,
  className,
  showContinue,
  continueLoading,
  onContinue,
  headerSlot,
  footerSlot,
}: Props) {
  return (
    <OnyxAssistantMessageBubble
      content={text}
      streaming={streaming}
      showContinue={showContinue}
      continueLoading={continueLoading}
      onContinue={onContinue}
      headerSlot={headerSlot}
      footerSlot={footerSlot}
      className={cn("min-w-0 flex-1 max-w-[min(100%,42rem)]", className)}
    />
  );
}
