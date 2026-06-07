/** Groq / Vercel AI SDK hata gövdelerinden HTTP durum kodu çıkarır */
export function extractGroqErrorStatus(err: unknown): number | undefined {
  if (err == null) return undefined;

  if (typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.statusCode === "number") return o.statusCode;
    if (typeof o.status === "number") return o.status;

    if (o.lastError) {
      const nested = extractGroqErrorStatus(o.lastError);
      if (nested) return nested;
    }

    if (Array.isArray(o.errors)) {
      for (const item of o.errors) {
        const nested = extractGroqErrorStatus(item);
        if (nested) return nested;
      }
    }

    if (o.cause) {
      const nested = extractGroqErrorStatus(o.cause);
      if (nested) return nested;
    }
  }

  const message = err instanceof Error ? err.message : String(err);
  if (/rate limit|rate_limit|429/i.test(message)) return 429;
  if (/413|too large|TPM/i.test(message)) return 413;

  return undefined;
}

/** Kullanıcıya gösterilecek Türkçe limit mesajı */
export function formatGroqRateLimitMessage(detail?: string): string {
  const msg = String(detail ?? "").trim();
  if (/tokens per day|TPD|Used \d+.*Limit \d+/i.test(msg)) {
    const waitMatch = msg.match(/try again in ([^.]+)/i);
    const wait = waitMatch?.[1]?.trim();
    return wait
      ? `Groq günlük token limitine ulaşıldı (Derin mod / 70B). Yaklaşık ${wait} sonra yenilenir — şimdilik ⚡ Hızlı modu kullanın.`
      : "Groq günlük token limitine ulaşıldı (Derin mod / 70B). ⚡ Hızlı modu seçerek devam edebilirsiniz.";
  }
  return "Groq istek limiti aşıldı. Birkaç saniye bekleyin veya ⚡ Hızlı modu deneyin.";
}

export function isGroqRateLimitError(err: unknown): boolean {
  const status = extractGroqErrorStatus(err);
  if (status === 429 || status === 413) return true;
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /rate limit|rate_limit|tokens per day/i.test(message);
}
