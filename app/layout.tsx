import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppRootProviders } from "@/components/app-root-providers";
import { getSiteUrl } from "@/lib/seo/site-url";

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

const siteUrl = getSiteUrl();
const seoTitle = "Derecepanel - YKS Koçluk ve Öğrenci Takip Platformu";
const seoDescription =
  "DerecePanel ile YKS koçları öğrencilerini tek panelden yönetir: deneme takibi, konu analizi, haftalık program, kitap kütüphanesi ve performans raporları.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: seoTitle,
    template: "%s | DerecePanel",
  },
  description: seoDescription,
  applicationName: "DerecePanel",
  keywords: [
    "YKS",
    "koçluk paneli",
    "öğrenci takip",
    "deneme analizi",
    "konu takip",
    "haftalık program",
    "DerecePanel",
  ],
  authors: [{ name: "DerecePanel", url: siteUrl }],
  creator: "DerecePanel",
  publisher: "DerecePanel",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: "DerecePanel",
    title: seoTitle,
    description: seoDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description: seoDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
