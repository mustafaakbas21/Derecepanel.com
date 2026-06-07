"use server";

import { revalidatePath } from "next/cache";

/** Koç ana sayfası — RSC / layout önbelleğini temizler */
export async function revalidateCoachDashboard(): Promise<void> {
  revalidatePath("/dashboard");
}
