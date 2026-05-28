import { redirect } from "next/navigation";

/** Eski rota — yeni konum: /dashboard/ogrencilerim */
export default function OgrencilerRedirectPage() {
  redirect("/dashboard/ogrencilerim");
}
