import "server-only";

import type { CoachBriefingSyncPayload } from "@/lib/coach/coach-briefing-sync";
import {
  assembleBriefingFromPayload,
  buildCoachBriefingFacts,
} from "@/lib/coach/coach-briefing-engine";
import { generateCoachBriefingText } from "@/lib/coach/coach-briefing-ai";
import type { OnyxCoachBriefingData } from "@/lib/coach/briefing-types";
import {
  fetchCoachBriefingFromAppwrite,
  isAppwriteBriefingReady,
} from "@/lib/appwrite/coach-briefing-server";

export async function buildCoachBriefing(
  coachId: string,
  sync?: CoachBriefingSyncPayload
): Promise<OnyxCoachBriefingData> {
  if (isAppwriteBriefingReady()) {
    try {
      const fromDb = await fetchCoachBriefingFromAppwrite(coachId);
      if (fromDb) return fromDb;
    } catch (err) {
      console.warn("[CoachBriefing] Appwrite fallback → client sync:", err);
    }
  }

  if (!sync) {
    throw new Error("Brifing için veri gövdesi gerekli (client sync).");
  }

  const facts = buildCoachBriefingFacts(coachId, sync);
  const briefingText = await generateCoachBriefingText(facts);
  return assembleBriefingFromPayload(coachId, sync, briefingText, "client-sync");
}
