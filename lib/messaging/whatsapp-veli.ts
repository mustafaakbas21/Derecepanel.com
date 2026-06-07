import { loadCatalogStudents } from "@/lib/exams/student-catalog-bridge";
import type { ExamResultRow } from "@/lib/exams/types";
import { loadStudentsFull } from "@/lib/students/storage";

const SITE_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://derecepanel.com";

export function normalizeTurkPhone(raw: string | undefined | null): string {
  const d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 12 && d.slice(0, 2) === "90" && d.charAt(2) === "5") return d;
  if (d.length === 11 && d.charAt(0) === "0" && d.charAt(1) === "5") return `90${d.slice(1)}`;
  if (d.length === 10 && d.charAt(0) === "5") return `90${d}`;
  if (d.length >= 11 && d.slice(0, 2) === "90") return d;
  return d.length >= 10 ? d : "";
}

export function pickPhoneForStudent(rec: ExamResultRow): string {
  const catalog = loadCatalogStudents();
  const sid = String(rec.studentId || "");
  const fromCat = catalog.find((s) => s.id === sid);
  const raw =
    (rec as { veliTelefon?: string; parentPhone?: string; phone?: string }).veliTelefon ||
    (rec as { parentPhone?: string }).parentPhone ||
    (rec as { phone?: string }).phone ||
    (rec as { studentPhone?: string }).studentPhone ||
    (rec as { gsm?: string }).gsm ||
    (rec as { telefon?: string }).telefon ||
    "";
  if (raw) return normalizeTurkPhone(raw);
  if (typeof window !== "undefined") {
    const full = loadStudentsFull({ seedIfEmpty: false }).find(
      (s) => s.ogrenciId === sid || s.studentCode === String(rec.studentCode || "")
    );
    if (full?.parentPhone) return normalizeTurkPhone(full.parentPhone);
    if (full?.phone) return normalizeTurkPhone(full.phone);
  }
  void fromCat;
  return "";
}

export function buildVeliMessage(
  studentName: string,
  examName: string,
  netStr: string,
  siteUrl = SITE_URL
): string {
  return `Sayın Veli, öğrenciniz ${studentName}'nin ${examName} sonuçları açıklanmıştır. Toplam Net: ${netStr}. Detaylı karne ve analizleriniz için sistemimize giriş yapabilirsiniz: ${siteUrl}`;
}

export function whatsAppUrl(phone: string, message: string): string {
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
