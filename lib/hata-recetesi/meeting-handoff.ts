import { setHandoff, takeHandoff } from "@/lib/panel-store/handoff";
import { HATA_RECETE_LS } from "@/lib/hata-recetesi/constants";
import type { MeetingHandoffPayload } from "@/lib/hata-recetesi/types";

export function consumeMeetingHandoff(): MeetingHandoffPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = takeHandoff(HATA_RECETE_LS.meetingHandoff);
    if (!raw) return null;
    const o = JSON.parse(raw) as MeetingHandoffPayload;
    if (!o || typeof o !== "object") return null;
    return o;
  } catch {
    return null;
  }
}

export function setMeetingHandoff(payload: MeetingHandoffPayload): void {
  if (typeof window === "undefined") return;
  setHandoff(HATA_RECETE_LS.meetingHandoff, JSON.stringify(payload));
}
