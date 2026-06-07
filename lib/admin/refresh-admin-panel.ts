import { hydratePanelStore } from "@/lib/panel-store";

/** Koç / öğrenci panel verisini sunucudan tekrar çeker. */
export async function refreshAdminPanelData(): Promise<void> {
  try {
    await hydratePanelStore();
  } catch {
    /* sessiz — bir sonraki poll tekrar dener */
  }
}
