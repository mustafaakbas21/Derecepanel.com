"use client";

import { memo } from "react";

import { AnalyticsResponseCard } from "@/components/onyx/responses/analytics-response-card";
import { CareerResponseCard } from "@/components/onyx/responses/career-response-card";
import { MentalResponseCard } from "@/components/onyx/responses/mental-response-card";
import { StandardChatBubble } from "@/components/onyx/responses/standard-chat-bubble";
import { StrategyResponseCard } from "@/components/onyx/responses/strategy-response-card";
import { VisionResponseCard } from "@/components/onyx/responses/vision-response-card";
import { YoutubeResponseCard } from "@/components/onyx/responses/youtube-response-card";
import { resolveDisplaySkillResponse } from "@/lib/onyx/skill-adapters";
import type { OnyxCareerCounseling } from "@/lib/onyx/career-counseling";
import type { OnyxDeepErrorDiagnosis } from "@/lib/onyx/deep-error-diagnosis";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import type { OnyxSkillResponse } from "@/lib/onyx/skill-types";

import type { OnyxSkillType } from "@/lib/onyx/skill-types";

export type OnyxRenderableMessage = {
  content: string;
  streaming?: boolean;
  pendingSkillType?: OnyxSkillType;
  onyxResponse?: OnyxSkillResponse;
  careerCounseling?: OnyxCareerCounseling;
  deepErrorDiagnosis?: OnyxDeepErrorDiagnosis;
};

type RenderProps = {
  message: OnyxRenderableMessage;
  role?: OnyxRole;
  studentId?: string;
  showContinue?: boolean;
  continueLoading?: boolean;
  onContinue?: () => void;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
};

export const OnyxResponseRenderer = memo(function OnyxResponseRenderer({
  message,
  role = "student",
  studentId,
  showContinue,
  continueLoading,
  onContinue,
  headerSlot,
  footerSlot,
}: RenderProps) {
  if (message.streaming) {
    if (message.pendingSkillType === "analytics") {
      return <AnalyticsResponseCard isLoading />;
    }
    return (
      <StandardChatBubble
        text={message.content}
        streaming
        showContinue={showContinue}
        continueLoading={continueLoading}
        onContinue={onContinue}
        headerSlot={headerSlot}
        footerSlot={footerSlot}
      />
    );
  }

  const resolved = resolveDisplaySkillResponse({
    onyxResponse: message.onyxResponse,
    careerCounseling: message.careerCounseling,
    deepErrorDiagnosis: message.deepErrorDiagnosis,
    reply: message.content,
    role,
  });

  if (!resolved) {
    return (
      <StandardChatBubble
        text={message.content}
        showContinue={showContinue}
        continueLoading={continueLoading}
        onContinue={onContinue}
        headerSlot={headerSlot}
        footerSlot={footerSlot}
      />
    );
  }

  switch (resolved.type) {
    case "vision":
      return <VisionResponseCard data={resolved.data} />;
    case "strategy":
      return (
        <StrategyResponseCard data={resolved.data} studentId={studentId} />
      );
    case "analytics":
      return <AnalyticsResponseCard data={resolved.data} />;
    case "career":
      return <CareerResponseCard data={resolved.data} />;
    case "youtube":
      return <YoutubeResponseCard data={resolved.data} />;
    case "mental":
      return <MentalResponseCard data={resolved.data} />;
    case "chat":
    default:
      return (
        <StandardChatBubble
          text={resolved.data.text || message.content}
          showContinue={showContinue}
          continueLoading={continueLoading}
          onContinue={onContinue}
          headerSlot={headerSlot}
          footerSlot={footerSlot}
        />
      );
  }
});
