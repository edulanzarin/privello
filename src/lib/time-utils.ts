/** Minutos desde meia-noite (0–1439). */
export function timeToMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return 0;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return Math.min(1439, Math.max(0, h * 60 + min));
}

export function minutesToTime(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutesToTime(hhmm: string, add: number): string {
  return minutesToTime(timeToMinutes(hhmm) + add);
}

/** Domingo = 0 … Sábado = 6 (Date.getUTCDay / getDay em horário local). */
export function weekdayFromDate(d: Date): number {
  return d.getDay();
}

export function startOfTodayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function parseMonthParam(ym: string | undefined): { year: number; month: number } {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() + 1 };
  }
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() + 1 };
  }
  return { year: y, month: m };
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
