import { NextResponse } from "next/server";

import { listAccountingTransactions } from "@/lib/admin/accounting-server";
import { isMaintenanceModeServer } from "@/lib/admin/maintenance-server";
import { listRegistrationRequests } from "@/lib/admin/registration-requests-server";
import { AuthError, requireAdminAuth } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const [accounting, registrationRequests, maintenance] = await Promise.all([
    listAccountingTransactions(),
    listRegistrationRequests(),
    isMaintenanceModeServer(),
  ]);

  return NextResponse.json({
    accounting,
    registrationRequests,
    maintenance,
  });
}
