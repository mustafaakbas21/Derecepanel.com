/** İstemci bileşenlerinde ilk render'da kullanılabilir "şimdi" (SSR ile uyumlu). */
export function clientNow(): Date {
  return new Date();
}

export function clientMonthView(now = clientNow()): { year: number; month: number } {
  return { year: now.getFullYear(), month: now.getMonth() };
}
