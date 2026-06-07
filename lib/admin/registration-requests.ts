export const REGISTRATION_REQUESTS_KEY = "registration_requests_v1";

export type RegistrationRequestStatus = "yeni" | "okundu";

export type RegistrationRequestRecord = {
  id: string;
  role: "ogrenci" | "koc" | "kurum";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  planId?: string;
  planName?: string;
  billingPeriod?: "aylik" | "yillik";
  organization?: string;
  teamSize?: string;
  status: RegistrationRequestStatus;
  createdAt: string;
};

export function parseRegistrationRequests(raw: string | null): RegistrationRequestRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RegistrationRequestRecord[]) : [];
  } catch {
    return [];
  }
}
