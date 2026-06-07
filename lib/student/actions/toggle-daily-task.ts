"use server";

import { revalidatePath } from "next/cache";

import { requireStudentSession } from "@/lib/auth/require-student";
import { updateTaskStatusInAppwrite } from "@/lib/appwrite/daily-tasks-server";

export async function toggleStudentDailyTask(
  taskId: string,
  completed: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireStudentSession();
    const ok = await updateTaskStatusInAppwrite(
      session.studentId,
      taskId,
      completed
    );
    if (!ok) {
      return {
        ok: false,
        error: "Görev güncellenemedi. Appwrite bağlantısını kontrol edin.",
      };
    }
    revalidatePath("/ogrenci");
    return { ok: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Görev güncellenirken hata oluştu.";
    return { ok: false, error: message };
  }
}
