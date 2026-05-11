import type { AvailabilityRule, Profile, ProfileDurationOption } from "@prisma/client";
import {
  addMinutesToTime,
  minutesToTime,
  startOfTodayLocal,
  timeToMinutes,
  weekdayFromDate,
} from "@/lib/time-utils";

export const SLOT_STEP_MIN = 30;

export type DayWindow = { startMin: number; endMin: number };

/** Regra do dia: CLOSED ou janela start–end (end exclusivo para geração de slots). */
export function getWindowForWeekday(
  rules: Pick<AvailabilityRule, "weekday" | "startTime" | "endTime" | "status">[],
  weekday: number,
): DayWindow | null {
  const rule = rules.find((r) => r.weekday === weekday);
  if (!rule || rule.status === "CLOSED") return null;
  const startMin = timeToMinutes(rule.startTime);
  const endMin = timeToMinutes(rule.endTime);
  if (endMin <= startMin) return null;
  return { startMin, endMin };
}

/** Inícios a cada `stepMin`, com início em [startMin, endMin). Ex.: 12:00–17:00 → …, 16:30. */
export function generateHalfHourStarts(window: DayWindow, stepMin = SLOT_STEP_MIN): string[] {
  const out: string[] = [];
  for (let t = window.startMin; t < window.endMin; t += stepMin) {
    out.push(minutesToTime(t));
  }
  return out;
}

/** Filtra horários de início onde início + duração cabe na janela do dia. */
export function filterStartsForDuration(
  starts: string[],
  durationMinutes: number,
  window: DayWindow,
): string[] {
  return starts.filter((s) => {
    const sm = timeToMinutes(s);
    return sm + durationMinutes <= window.endMin;
  });
}

export type ResolvedDuration = {
  minutes: number;
  label: string;
  priceBrl: number;
  source: "db" | "fallback";
};

export function resolveDurationOptions(
  profile: Pick<Profile, "priceHour" | "priceTwoHours" | "priceOvernight" | "priceTravelDay"> & {
    durationOptions: ProfileDurationOption[];
  },
): ResolvedDuration[] {
  const active = profile.durationOptions
    .filter((o) => o.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.minutes - b.minutes);
  if (active.length) {
    return active.map((o) => ({
      minutes: o.minutes,
      label: o.label,
      priceBrl: o.priceBrl,
      source: "db" as const,
    }));
  }
  const two = profile.priceTwoHours ?? Math.round(profile.priceHour * 1.75);
  const pernoite = profile.priceOvernight ?? profile.priceHour * 5;
  return [
    { minutes: 60, label: "1 hora", priceBrl: profile.priceHour, source: "fallback" },
    { minutes: 90, label: "1h30", priceBrl: Math.round((profile.priceHour + two) / 2), source: "fallback" },
    { minutes: 120, label: "2 horas", priceBrl: two, source: "fallback" },
    { minutes: 180, label: "3 horas", priceBrl: Math.round(two * 1.45), source: "fallback" },
    { minutes: 720, label: "Pernoite", priceBrl: pernoite, source: "fallback" },
  ];
}

export function calendarMonthCells(year: number, month: number): { date: Date | null }[] {
  const first = new Date(year, month - 1, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: { date: Date | null }[] = [];
  for (let i = 0; i < startPad; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month - 1, d) });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null });
  return cells;
}

export function isDateBeforeToday(d: Date): boolean {
  const t0 = startOfTodayLocal().getTime();
  const t1 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return t1 < t0;
}

export function isDateSelectable(
  d: Date,
  rules: Pick<AvailabilityRule, "weekday" | "startTime" | "endTime" | "status">[],
): boolean {
  if (isDateBeforeToday(d)) return false;
  const w = weekdayFromDate(d);
  return getWindowForWeekday(rules, w) != null;
}

export function computeEndTimeLabel(startHHMM: string, durationMinutes: number): string {
  return addMinutesToTime(startHHMM, durationMinutes);
}
