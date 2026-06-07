/** Proaktif Onyx Asistanı — paylaşımlı tipler */

export type BriefingAppointment = {
  id: string;
  time: string;
  studentName: string;
  href: string;
};

export type BriefingPendingItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
  actionLabel: string;
};

export type BriefingCompletedItem = {
  id: string;
  label: string;
};

export type BriefingRadarStudent = {
  id: string;
  name: string;
  alert: string;
  severity: "critical" | "warning";
  href: string;
};

export type OnyxCoachBriefingData = {
  briefingText: string;
  appointments: BriefingAppointment[];
  pending: BriefingPendingItem[];
  completed: BriefingCompletedItem[];
  radar: BriefingRadarStudent[];
  /** client-sync | supabase */
  source?: string;
  generatedAt?: string;
};

export function coachBriefingGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export function stripBriefingGreetingPrefix(text: string): string {
  return text
    .replace(/^(Günaydın|İyi günler|İyi akşamlar)\.\s*/i, "")
    .trim();
}
