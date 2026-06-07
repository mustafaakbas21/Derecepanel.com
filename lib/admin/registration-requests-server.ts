import "server-only";

import {
  parseRegistrationRequests,
  REGISTRATION_REQUESTS_KEY,
  type RegistrationRequestRecord,
  type RegistrationRequestStatus,
} from "@/lib/admin/registration-requests";
import { getPlatformData, setPlatformData } from "@/lib/admin/platform-store-server";
import type { RegisterRole } from "@/lib/marketing/registration-request";

export async function listRegistrationRequests(): Promise<RegistrationRequestRecord[]> {
  const raw = await getPlatformData(REGISTRATION_REQUESTS_KEY);
  return parseRegistrationRequests(raw);
}

async function saveRegistrationRequests(items: RegistrationRequestRecord[]): Promise<void> {
  await setPlatformData(REGISTRATION_REQUESTS_KEY, JSON.stringify(items.slice(0, 500)));
}

export async function appendRegistrationRequest(input: {
  role: RegisterRole;
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
}): Promise<RegistrationRequestRecord> {
  const items = await listRegistrationRequests();

  const record: RegistrationRequestRecord = {
    id: `req-${crypto.randomUUID()}`,
    role: input.role,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || undefined,
    message: input.message?.trim() || undefined,
    planId: input.planId?.trim() || undefined,
    planName: input.planName?.trim() || undefined,
    billingPeriod: input.billingPeriod,
    organization: input.organization?.trim() || undefined,
    teamSize: input.teamSize?.trim() || undefined,
    status: "yeni",
    createdAt: new Date().toISOString(),
  };

  items.unshift(record);
  await saveRegistrationRequests(items);
  return record;
}

export type RegistrationRequestUpdate = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
  role?: RegisterRole;
  status?: RegistrationRequestStatus;
  planName?: string;
  billingPeriod?: "aylik" | "yillik";
  organization?: string;
  teamSize?: string;
};

export async function updateRegistrationRequest(
  id: string,
  patch: RegistrationRequestUpdate
): Promise<RegistrationRequestRecord | null> {
  const items = await listRegistrationRequests();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;

  const prev = items[idx]!;
  const updated: RegistrationRequestRecord = {
    ...prev,
    firstName: patch.firstName?.trim() || prev.firstName,
    lastName: patch.lastName?.trim() || prev.lastName,
    email: patch.email?.trim() || prev.email,
    phone: patch.phone !== undefined ? patch.phone.trim() || undefined : prev.phone,
    message: patch.message !== undefined ? patch.message.trim() || undefined : prev.message,
    role: patch.role ?? prev.role,
    status: patch.status ?? prev.status,
    planName: patch.planName !== undefined ? patch.planName.trim() || undefined : prev.planName,
    billingPeriod: patch.billingPeriod ?? prev.billingPeriod,
    organization:
      patch.organization !== undefined ? patch.organization.trim() || undefined : prev.organization,
    teamSize: patch.teamSize !== undefined ? patch.teamSize.trim() || undefined : prev.teamSize,
  };

  items[idx] = updated;
  await saveRegistrationRequests(items);
  return updated;
}

export async function deleteRegistrationRequest(id: string): Promise<boolean> {
  const items = await listRegistrationRequests();
  const next = items.filter((i) => i.id !== id);
  if (next.length === items.length) return false;
  await saveRegistrationRequests(next);
  return true;
}
