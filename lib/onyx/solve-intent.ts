/** Kullanıcı ilk mesajda tam çözüm istiyor mu (Sokratik atlanır) */
export function wantsImmediateQuestionSolve(prompt: string): boolean {
  const p = String(prompt || "").trim().toLowerCase();
  if (!p) return false;
  if (/bu\s+soruyu\s+çöz|soruyu\s+çöz|tam\s*çözüm|adım\s*adım\s*çöz|cevab[ıi]n[ıi]\s+ver|hesapla/i.test(p)) {
    return true;
  }
  return /\b(çöz|çözüm|coz|cozum|solve|solution)\b/i.test(p);
}
