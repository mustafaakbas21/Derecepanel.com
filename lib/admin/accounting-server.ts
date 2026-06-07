import "server-only";

import {
  ACCOUNTING_KEY,
  type AccountingDraft,
  type AccountingTransaction,
} from "@/lib/admin/accounting";
import { getPlatformData, setPlatformData } from "@/lib/admin/platform-store-server";

export function parseAccountingTransactions(raw: string | null): AccountingTransaction[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as AccountingTransaction[])
      .filter((t) => t?.id && !String(t.id).startsWith("txn-seed-"))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

async function saveTransactions(items: AccountingTransaction[]): Promise<void> {
  await setPlatformData(ACCOUNTING_KEY, JSON.stringify(items));
}

export async function listAccountingTransactions(): Promise<AccountingTransaction[]> {
  const raw = await getPlatformData(ACCOUNTING_KEY);
  return parseAccountingTransactions(raw);
}

export async function upsertAccountingTransaction(
  draft: AccountingDraft,
  existingId?: string
): Promise<AccountingTransaction> {
  const list = await listAccountingTransactions();
  const title = draft.title.trim();
  if (!title) throw new Error("Başlık zorunlu.");
  if (!Number.isFinite(draft.amount) || draft.amount <= 0) {
    throw new Error("Geçerli bir tutar girin.");
  }
  if (!draft.date) throw new Error("Tarih zorunlu.");

  const payload: AccountingTransaction = {
    id: existingId || `txn-${crypto.randomUUID()}`,
    type: draft.type,
    category: draft.category,
    title,
    amount: Math.round(draft.amount * 100) / 100,
    date: draft.date,
    status: draft.status,
    description: draft.description?.trim() || undefined,
    relatedCoachId: draft.relatedCoachId?.trim() || undefined,
    relatedStudentId: draft.relatedStudentId?.trim() || undefined,
    relatedInstitutionId: draft.relatedInstitutionId?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  if (existingId) {
    const idx = list.findIndex((t) => t.id === existingId);
    if (idx === -1) throw new Error("Kayıt bulunamadı.");
    payload.createdAt = list[idx]!.createdAt;
    list[idx] = payload;
  } else {
    list.unshift(payload);
  }

  await saveTransactions(list);
  return payload;
}

export async function deleteAccountingTransaction(id: string): Promise<boolean> {
  const list = await listAccountingTransactions();
  const next = list.filter((t) => t.id !== id);
  if (next.length === list.length) return false;
  await saveTransactions(next);
  return true;
}
