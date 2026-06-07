import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppRootProviders } from "@/components/app-root-providers";

import "katex/dist/katex.min.css";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://derecepanel.com",
  ),
  title: "DerecePanel — YKS Koç Paneli",
  description: "YKS koçluk ve öğrenci yönetim paneli",
  applicationName: "DerecePanel",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppRootProviders>{children}</AppRootProviders>
      </body>
    </html>
  );
}
