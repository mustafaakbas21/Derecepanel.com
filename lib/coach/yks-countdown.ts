export const yksCountdownConfig = {
  title: "YKS geri sayım",
  subtitle: "TYT oturumuna kalan süre",
  /** TYT 2026 — örnek tarih */
  targetDate: new Date("2026-06-20T10:15:00+03:00"),
  progressPercent: 72,
  sessions: [
    {
      type: "TYT" as const,
      status: "Sıradaki oturum",
      statusTone: "success" as const,
      date: "20 Haziran 2026",
      dayTime: "Cumartesi · 10:15",
      remainingLabel: "23 gün 10 saat kaldı",
      targetDate: new Date("2026-06-20T10:15:00+03:00"),
    },
    {
      type: "AYT" as const,
      status: "Yaklaşıyor",
      statusTone: "muted" as const,
      date: "21 Haziran 2026",
      dayTime: "Pazar · 10:15",
      remainingLabel: "24 gün 10 saat kaldı",
      targetDate: new Date("2026-06-21T10:15:00+03:00"),
    },
  ],
};

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getCountdownParts(target: Date, now = new Date()): CountdownParts {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export function formatCountdownUnit(value: number, width: 2 | 3 = 2): string {
  return String(value).padStart(width, "0");
}

export function formatRemainingLabel(target: Date, now = new Date()): string {
  const { days, hours } = getCountdownParts(target, now);
  return `${days} gün ${hours} saat kaldı`;
}
