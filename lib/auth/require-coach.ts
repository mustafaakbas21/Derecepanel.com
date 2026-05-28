import { DEFAULT_COACH_ID } from "@/lib/students/constants";

export type CoachSession = {
  coachId: string;
  role: "coach" | "institution";
};

/**
 * MVP: oturum yokken varsayılan koç kimliği.
 * Gerçek auth eklendiğinde cookie/session doğrulaması buraya taşınır.
 */
export async function requireCoachAuth(): Promise<CoachSession> {
  // TODO: NextAuth / session cookie kontrolü
  return { coachId: DEFAULT_COACH_ID, role: "coach" };
}
