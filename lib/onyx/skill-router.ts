import type { OnyxEmptyStateActionId } from "@/lib/onyx/empty-state-actions";
import type { OnyxSkillKind, OnyxSkillType } from "@/lib/onyx/skill-types";
import type { OnyxActionType } from "@/lib/onyx/types";
import { isYoutubeLinkInText } from "@/lib/onyx/youtube-link";
import { isStrategyIntentText } from "@/lib/onyx/strategy-intent";
import { isMentalIntentText } from "@/lib/onyx/mental-intent";

type RoutableAction = OnyxActionType | "general";

/** Welcome kartı → skillType */
export function emptyStateActionToSkillType(
  id: OnyxEmptyStateActionId
): OnyxSkillType {
  switch (id) {
    case "photo":
    case "file-upload":
      return "vision_solve";
    case "net-strategy":
      return "strategy";
    case "data-analysis":
      return "analytics";
    case "youtube-assistant":
      return "youtube_assistant";
    case "mental-coach":
      return "mental_coach";
    case "career-counseling":
      return "career";
    case "direct-ask":
    default:
      return "chat";
  }
}

/** Panel aksiyonu → skillType */
export function actionToSkillType(action?: RoutableAction | string): OnyxSkillType {
  switch (action) {
    case "soru-fotografi":
    case "soru-metin":
      return "vision_solve";
    case "net-avcisi":
    case "hedef-net-yol-haritasi":
    case "acil-net-roketi":
    case "gunun-gorevleri":
    case "haftalik-program":
    case "boss-savasi":
      return "strategy";
    case "deneme-trend":
    case "osym-zor-konular":
      return "analytics";
    case "kariyer-tercih":
      return "career";
    case "feynman-modu":
      return "youtube_assistant";
    case "kriz-modu":
    case "mental-check-in":
      return "mental_coach";
    default:
      return "chat";
  }
}

export function skillTypeToAction(skillType: OnyxSkillType): RoutableAction {
  switch (skillType) {
    case "vision_solve":
      return "soru-fotografi";
    case "strategy":
      return "net-avcisi";
    case "analytics":
      return "deneme-trend";
    case "career":
      return "kariyer-tercih";
    case "youtube_assistant":
      return "feynman-modu";
    case "mental_coach":
      return "kriz-modu";
    case "chat":
    default:
      return "general";
  }
}

export function skillTypeToResponseKind(skillType: OnyxSkillType): OnyxSkillKind {
  switch (skillType) {
    case "vision_solve":
      return "vision";
    case "strategy":
      return "strategy";
    case "analytics":
      return "analytics";
    case "career":
      return "career";
    case "youtube_assistant":
      return "youtube";
    case "mental_coach":
      return "mental";
    case "chat":
    default:
      return "chat";
  }
}

const STRUCTURED_SKILL_TYPES: OnyxSkillType[] = [
  "career",
  "strategy",
  "analytics",
  "youtube_assistant",
  "mental_coach",
];

export function isStructuredSkillType(skillType: OnyxSkillType): boolean {
  return STRUCTURED_SKILL_TYPES.includes(skillType);
}

export function resolveSkillType(input: {
  skillType?: OnyxSkillType | string;
  action?: RoutableAction | string;
  prompt?: string;
  hasVision?: boolean;
  careerIntent?: boolean;
  strategyIntent?: boolean;
  mentalIntent?: boolean;
}): OnyxSkillType {
  const explicit = String(input.skillType ?? "").trim() as OnyxSkillType;
  if (
    explicit === "vision_solve" ||
    explicit === "strategy" ||
    explicit === "analytics" ||
    explicit === "career" ||
    explicit === "youtube_assistant" ||
    explicit === "mental_coach" ||
    explicit === "chat"
  ) {
    return explicit;
  }
  if (input.hasVision) return "vision_solve";
  if (input.careerIntent) return "career";
  if (input.strategyIntent || isStrategyIntentText(String(input.prompt ?? ""))) {
    return "strategy";
  }
  if (input.mentalIntent || isMentalIntentText(String(input.prompt ?? ""))) {
    return "mental_coach";
  }

  const actionSkill = actionToSkillType(input.action);
  if (actionSkill === "chat" && isYoutubeLinkInText(String(input.prompt ?? ""))) {
    return "youtube_assistant";
  }

  return actionSkill;
}
