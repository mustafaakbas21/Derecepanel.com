import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Giriş Yap — DerecePanel",
  description: "Koç veya öğrenci paneline kullanıcı adı ve şifre ile giriş yapın.",
};

export default function GirisLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
