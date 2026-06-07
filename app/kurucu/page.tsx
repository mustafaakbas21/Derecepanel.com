import { notFound } from "next/navigation";

import { KurucuUnlockClient } from "@/components/admin/kurucu-unlock-client";

/**
 * Gizli kurucu erişim kapısı — `/giris` sayfasında link yok.
 * Yalnızca geliştirme: http://localhost:3000/kurucu
 */
export default function KurucuUnlockPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <KurucuUnlockClient />;
}
